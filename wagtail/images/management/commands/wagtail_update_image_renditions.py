from django.core.management.base import BaseCommand, CommandError
from wagtail.images.models import Rendition, Image

class Command(BaseCommand):
    help = 'Updates image renditions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--purge', 
            action='store_true', 
            help='Purge and regenerate all image renditions'
        )

        parser.add_argument(
            '--purge-only',
            action='store_true',
            help='Only purge all image renditions'
        )


    def handle(self, *args, **options):
        renditions = Rendition.objects.all()

        
        if options['purge']:
            for rendition in renditions:
                try:
                    rendition_filter = rendition.filter
                    rendition_image = rendition.image
                    rendition.delete()
                    rendition_image.get_rendition(rendition_filter)
                except:
                    self.stdout.write(self.style.ERROR('Could not purge and regenerate rendition for %s', rendition_image.title))
            self.stdout.write(self.style.SUCCESS('Successfully purged and regenerated image renditions!'))
        elif options['purge_only'] :
            for rendition in renditions:
                try:
                    rendition_image = rendition.image
                    rendition.delete()
                except:
                    self.stdout.write(self.style.ERROR('Could not purge rendition for %s', rendition_image.title))
            self.stdout.write(self.style.SUCCESS('Successfully purged image renditions!'))
        else:
            for rendition in renditions:
                try:
                    rendition.image.get_rendition(rendition.filter)
                except:
                    self.stdout.write(self.style.ERROR('Could not regenerate rendition for %s', rendition.image.title))
            self.stdout.write(self.style.SUCCESS('Succesfully regenerated image renditions!'))
                
