import functools
import json

from django import forms
from django.forms.formsets import DELETION_FIELD_NAME, ORDERING_FIELD_NAME
from django.utils.functional import cached_property
from django.utils.text import capfirst

from wagtail.admin import compare
from wagtail.admin.telepath import register as register_telepath_adapter

from .base import Panel, get_form_for_model
from .group import MultiFieldPanel
from .model_utils import extract_panel_definitions_from_model_class


class InlinePanel(Panel):
    def __init__(
        self,
        relation_name,
        panels=None,
        heading="",
        label="",
        min_num=None,
        max_num=None,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.relation_name = relation_name
        self.panels = panels
        self.heading = (
            heading
            if heading
            else capfirst(label)
            if label
            else capfirst(relation_name.replace("_", " "))
        )
        self.label = label
        self.min_num = min_num
        self.max_num = max_num

    def clone_kwargs(self):
        kwargs = super().clone_kwargs()
        kwargs.update(
            relation_name=self.relation_name,
            panels=self.panels,
            label=self.label,
            min_num=self.min_num,
            max_num=self.max_num,
        )
        return kwargs

    @cached_property
    def panel_definitions(self):
        # Look for a panels definition in the InlinePanel declaration
        if self.panels is not None:
            return self.panels
        # Failing that, get it from the model
        return extract_panel_definitions_from_model_class(
            self.db_field.related_model, exclude=[self.db_field.field.name]
        )

    @cached_property
    def child_edit_handler(self):
        panels = self.panel_definitions
        child_edit_handler = MultiFieldPanel(panels, heading=self.heading)
        return child_edit_handler.bind_to_model(self.db_field.related_model)

    def get_form_options(self):
        child_form_opts = self.child_edit_handler.get_form_options()

        formset_opts = {
            "fields": child_form_opts.get("fields", []),
            "widgets": child_form_opts.get("widgets", {}),
            "min_num": self.min_num,
            "validate_min": self.min_num is not None,
            "max_num": self.max_num,
            "validate_max": self.max_num is not None,
            "formsets": child_form_opts.get("formsets"),
        }

        defer_required_on_fields = child_form_opts.get("defer_required_on_fields")
        if defer_required_on_fields:
            # Options inside `formsets` are processed by django-modelcluster's
            # ClusterForm, which doesn't recognise the `defer_required_on_fields`
            # option. Instead, we'll use get_form_for_model to build a form class
            # with that option baked in, and pass that as the `form` option.
            base_form = get_form_for_model(
                self.db_field.related_model,
                defer_required_on_fields=defer_required_on_fields,
            )
            formset_opts["form"] = base_form

        return {
            "formsets": {
                self.relation_name: formset_opts,
            }
        }

    def on_model_bound(self):
        manager = getattr(self.model, self.relation_name)
        self.db_field = manager.rel
        if not self.label:
            self.label = self.db_field.related_model._meta.verbose_name

    def classes(self):
        return super().classes() + ["w-panel--nested"]

    @register_telepath_adapter
    class BoundPanel(Panel.BoundPanel):
        template_name = "wagtailadmin/panels/inline_panel.html"

        def __init__(self, **kwargs):
            super().__init__(**kwargs)

            self.label = self.panel.label

            if self.form is None:
                return

            self.formset = self.form.formsets[self.panel.relation_name]
            self.child_edit_handler = self.panel.child_edit_handler

            self.children = []
            for index, subform in enumerate(self.formset.forms):
                # override the DELETE field to have a hidden input
                subform.fields[DELETION_FIELD_NAME].widget = forms.HiddenInput()

                # ditto for the ORDER field, if present
                if self.formset.can_order:
                    subform.fields[ORDERING_FIELD_NAME].widget = forms.HiddenInput(
                        attrs={"value": index + 1}
                    )

                self.children.append(
                    self.child_edit_handler.get_bound_panel(
                        instance=subform.instance,
                        request=self.request,
                        form=subform,
                        prefix=("%s-%d" % (self.prefix, index)),
                    )
                )

            # if this formset is valid, it may have been re-ordered; respect that
            # in case the parent form errored and we need to re-render
            if self.formset.can_order and self.formset.is_valid():
                self.children.sort(
                    key=lambda child: child.form.cleaned_data[ORDERING_FIELD_NAME] or 1
                )

            empty_form = self.formset.empty_form
            empty_form.fields[DELETION_FIELD_NAME].widget = forms.HiddenInput()
            if self.formset.can_order:
                empty_form.fields[ORDERING_FIELD_NAME].widget = forms.HiddenInput()

            self.empty_child = self.child_edit_handler.get_bound_panel(
                instance=empty_form.instance,
                request=self.request,
                form=empty_form,
                prefix=("%s-__prefix__" % self.prefix),
            )

        def get_comparison(self):
            field_comparisons = []

            for index, panel in enumerate(self.panel.child_edit_handler.children):
                field_comparisons.extend(
                    panel.get_bound_panel(
                        instance=None,
                        request=self.request,
                        form=None,
                        prefix=("%s-%d" % (self.prefix, index)),
                    ).get_comparison()
                )

            return [
                functools.partial(
                    compare.ChildRelationComparison,
                    self.panel.db_field,
                    field_comparisons,
                    label=self.heading,
                )
            ]

        telepath_adapter_name = "wagtail.panels.InlinePanel"

        def js_opts(self):
            return {
                "type": type(self.panel).__name__,
                "formsetPrefix": f"id_{self.formset.prefix}",
                "emptyChildFormPrefix": self.empty_child.form.prefix,
                "canOrder": self.formset.can_order,
                "maxForms": self.formset.max_num,
                "relationName": self.panel.relation_name,
            }

        def get_context_data(self, parent_context=None):
            context = super().get_context_data(parent_context)
            context["options_json"] = json.dumps(self.js_opts())
            return context

        def telepath_pack(self, context):
            # pass initControls = False so that we do not initialize controls while calling
            # the constructor; this prevents attaching event handlers multiple times if the
            # object is unpacked multiple times
            return (self.telepath_adapter_name, [self.js_opts(), False])
