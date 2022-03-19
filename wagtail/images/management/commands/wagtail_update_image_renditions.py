from django.core.management.base import BaseCommand

from wagtail.images import get_image_model


class Command(BaseCommand):
    """Command to remove all generated image renditions."""

    help = "This command will update all image renditions, with an option to purge existing renditions first."

    def add_arguments(self, parser):
        parser.add_argument(
            "--purge",
            action="store_true",
            help="Purge and regenerate all image renditions",
        )
        parser.add_argument(
            "--purge-only",
            action="store_true",
            help="Purge all image renditions without regenerating them",
        )

    def handle(self, *args, **options):
        renditions = get_image_model().get_rendition_model().objects.all()
        if len(renditions) == 0:
            self.stdout.write("No image renditions found!")
            return
        success_count = 0
        if options["purge"]:
            for rendition in renditions:
                try:
                    rendition_filter = rendition.filter
                    rendition_image = rendition.image
                    rendition.delete()
                    rendition_image.get_rendition(rendition_filter)
                    success_count = success_count + 1
                except Exception:
                    self.stderr.write(
                        f"Could not purge and regenerate rendition for {rendition_image.title}"
                    )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully purged and regenerated {success_count} image renditions!"
                )
            )
        elif options["purge_only"]:
            for rendition in renditions:
                try:
                    rendition_image = rendition.image
                    rendition.delete()
                    success_count = success_count + 1
                except Exception:
                    self.stderr.write(
                        f"Could not purge rendition for {rendition_image.title}"
                    )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully purged {success_count} image renditions!"
                )
            )
        else:
            for rendition in renditions:
                try:
                    rendition.image.get_rendition(rendition.filter)
                    success_count = success_count + 1
                except Exception:
                    self.stderr.write(
                        f"Could not regenerate rendition for {rendition.image.title}"
                    )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Succesfully regenerated {success_count} image renditions!"
                )
            )
