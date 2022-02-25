# -*- coding: utf-8 -*-
# Generated by Django 1.9.4 on 2016-03-31 00:30
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("snippetstests", "0003_fancysnippet_standardsnippet"),
    ]

    operations = [
        migrations.CreateModel(
            name="FileUploadSnippet",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("file", models.FileField(upload_to="")),
            ],
        ),
    ]
