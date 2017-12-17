import json
import re

from urllib import request as urllib_request
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request

from wagtail.embeds.exceptions import EmbedNotFoundException
from wagtail.embeds.oembed_providers import all_providers

from .base import EmbedFinder


class OEmbedFinder(EmbedFinder):
    options = {}
    _endpoints = None

    def __init__(self, providers=None, options=None):
        self._endpoints = {}

        for provider in providers or all_providers:
            patterns = []
            templates = []

            endpoint = provider['endpoint'].replace('{format}', 'json')

            for url in provider['urls']:
                patterns.append(re.compile(url))

            for template in provider.get('templates', []):
                templates.append((re.compile(template[0]), template[1]))

            self._endpoints[endpoint] = (patterns, templates)

        if options:
            self.options = self.options.copy()
            self.options.update(options)

    def _get_endpoint(self, url):
        for endpoint, (patterns, templates) in self._endpoints.items():
            for pattern in patterns:
                if re.match(pattern, url):
                    return endpoint, url
            for template in templates:
                match = re.match(template[0], url)
                if match:
                    return endpoint, match.expand(template[1])
        return None, None

    def accept(self, original_url):
        endpoint, url = self._get_endpoint(original_url)
        return endpoint is not None

    def find_embed(self, original_url, max_width=None):
        # Find provider
        endpoint, url = self._get_endpoint(original_url)
        if endpoint is None:
            raise EmbedNotFoundException

        # Work out params
        params = self.options.copy()
        params['url'] = url
        params['format'] = 'json'
        if max_width:
            params['maxwidth'] = max_width

        # Perform request
        request = Request(endpoint + '?' + urlencode(params))
        request.add_header('User-agent', 'Mozilla/5.0')
        try:
            r = urllib_request.urlopen(request)
        except URLError:
            raise EmbedNotFoundException
        oembed = json.loads(r.read().decode('utf-8'))

        # Convert photos into HTML
        if oembed['type'] == 'photo':
            html = '<img src="%s" />' % (oembed['url'], )
        else:
            html = oembed.get('html')

        # Return embed as a dict
        return {
            'title': oembed['title'] if 'title' in oembed else '',
            'author_name': oembed['author_name'] if 'author_name' in oembed else '',
            'provider_name': oembed['provider_name'] if 'provider_name' in oembed else '',
            'type': oembed['type'],
            'thumbnail_url': oembed.get('thumbnail_url'),
            'width': oembed.get('width'),
            'height': oembed.get('height'),
            'html': html,
        }


embed_finder_class = OEmbedFinder
