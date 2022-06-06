from django import forms
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy


class SearchForm(forms.Form):
    def __init__(self, *args, **kwargs):
        placeholder = kwargs.pop("placeholder", _("Search"))
        super().__init__(*args, **kwargs)
        self.fields["q"].widget.attrs = {
            "placeholder": placeholder,
            "autofocus": True,
            "data-w-search-target": "termInput",
            "data-action": " ".join(
                [
                    f"{event}->w-search#search"
                    for event in ["keyup", "cut", "paste", "change"]
                ]
            ),
        }

    q = forms.CharField(label=gettext_lazy("Search term"), widget=forms.TextInput())
