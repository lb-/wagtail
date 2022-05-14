from pydoc import doc

from django.utils.translation import gettext_lazy as _

from wagtail.admin.views.bulk_action import BulkAction
from wagtail.contrib.forms.models import FormSubmission
from wagtail.contrib.forms.utils import get_form_submissions_as_data


class FormSubmissionBulkAction(BulkAction):
    #  this will not work! need to have a form page id to get its submissions
    models = [FormSubmission]
    form_page = None

    def get_execution_context(self):
        return {"user": self.request.user}

    def get_context_data(self, **kwargs):

        context = super().get_context_data(**kwargs)
        self.form_page = kwargs.get("form_page")

        (data_headings, data_rows) = get_form_submissions_as_data(
            data_fields=self.form_page.get_data_fields(),
            submissions=context["items"],
        )

        context.update(
            {
                "data_headings": data_headings,
                "data_rows": data_rows,
                "app_label": "wagtailforms",
                "model_name": "formsubmission",
            }
        )

        return context
