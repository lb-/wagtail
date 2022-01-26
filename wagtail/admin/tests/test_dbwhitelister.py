from bs4 import BeautifulSoup
from django.test import TestCase

from wagtail.admin.rich_text.converters.editor_html import EditorHTMLConverter


class TestDbWhitelisterMethods(TestCase):
    def setUp(self):
        self.whitelister = EditorHTMLConverter().whitelister

    def test_clean_tag_node_div(self):
        soup = BeautifulSoup('<div>foo</div>', 'html5lib')
        tag = soup.div
        self.assertEqual(tag.name, 'div')
        self.whitelister.clean_tag_node(soup, tag)
        self.assertEqual(tag.name, 'p')

    def test_clean_tag_node_with_data_embedtype(self):
        soup = BeautifulSoup(
            '<p><a data-embedtype="image" data-id=1 data-format="left" data-alt="bar" irrelevant="baz">foo</a></p>',
            'html5lib'
        )
        tag = soup.p
        self.whitelister.clean_tag_node(soup, tag)
        self.assertEqual(str(tag),
                         '<p><embed alt="bar" embedtype="image" format="left" id="1"/></p>')

    def test_clean_tag_node_with_data_linktype(self):
        soup = BeautifulSoup(
            '<a data-linktype="document" data-id="1" irrelevant="baz">foo</a>',
            'html5lib'
        )
        tag = soup.a
        self.whitelister.clean_tag_node(soup, tag)
        self.assertEqual(str(tag), '<a id="1" linktype="document">foo</a>')


class TestDbWhitelister(TestCase):
    def setUp(self):
        self.whitelister = EditorHTMLConverter().whitelister

    def assertHtmlEqual(self, str1, str2):
        """
        Assert that two HTML strings are equal at the DOM level
        (necessary because we can't guarantee the order that attributes are output in)
        """
        self.assertEqual(BeautifulSoup(str1, 'html5lib'), BeautifulSoup(str2, 'html5lib'))

    def test_document_link_is_rewritten(self):
        input_html = (
            '<p>Look at our <a data-linktype="document" data-id="1" href="/documents/1/brochure.pdf">'
            'horribly oversized brochure</a></p>'
        )
        output_html = self.whitelister.clean(input_html)
        expected = '<p>Look at our <a linktype="document" id="1">horribly oversized brochure</a></p>'
        self.assertHtmlEqual(expected, output_html)

    def test_image_embed_is_rewritten(self):
        input_html = (
            '<p>OMG look at this picture of a kitten:</p><figure data-embedtype="image" data-id="5"'
            ' data-format="image-with-caption" data-alt="A cute kitten" class="fancy-image">'
            '<img src="/media/images/kitten.jpg" width="320" height="200" alt="A cute kitten" />'
            '<figcaption>A kitten, yesterday.</figcaption></figure>'
        )
        output_html = self.whitelister.clean(input_html)
        expected = (
            '<p>OMG look at this picture of a kitten:</p><embed embedtype="image" id="5"'
            ' format="image-with-caption" alt="A cute kitten" />'
        )
        self.assertHtmlEqual(expected, output_html)

    def test_media_embed_is_rewritten(self):
        input_html = (
            '<p>OMG look at this video of a kitten: '
            '<iframe data-embedtype="media" data-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" width="640"'
            ' height="480" src="//www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe></p>'
        )
        output_html = self.whitelister.clean(input_html)
        expected = (
            '<p>OMG look at this video of a kitten:'
            ' <embed embedtype="media" url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" /></p>'
        )
        self.assertHtmlEqual(expected, output_html)
