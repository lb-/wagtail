(writing_templates)=

# Writing templates

Wagtail uses Django's templating language. For developers new to Django, start with Django's own template documentation:
[](inv:django#topics/templates)

Python programmers new to Django/Wagtail may prefer more technical documentation:
[](inv:django#ref/templates/api)

You should be familiar with Django templating basics before continuing with this documentation.

## Templates

Every type of page or "content-type" in Wagtail is defined as a "model" in a file called `models.py`. If your site has a blog, you might have a `BlogPage` model and another called `BlogPageListing`. The names of the models are up to the Django developer.

For each page model in `models.py`, Wagtail assumes an HTML template file exists of (almost) the same name. The Front End developer may need to create these templates themselves by referring to `models.py` to infer template names from the models defined therein.

To find a suitable template, Wagtail converts CamelCase names to snake_case. So for a `BlogPage` model, a template `blog_page.html` will be expected. The name of the template file can be overridden per model if necessary.

Template files are assumed to exist here:

```
name_of_project/
    name_of_app/
        templates/
            name_of_app/
                blog_page.html
        models.py
```

For more information, see the Django documentation for the [application directories template loader](inv:django#ref/templates/api).

### Page content

The data/content entered into each page is accessed/output through Django's `{{ double-brace }}` notation. Each field from the model must be accessed by prefixing `page.`. For example the page title `{{ page.title }}` or an author field `{{ page.author }}`.

A custom variable name can be configured on the page model {attr}`wagtail.models.Page.context_object_name`. If a custom name is defined, `page` is still available for use in shared templates.

Additionally, `request.` is available and contains Django's request object.

## Static assets

Static files (such as CSS, JS, and images) are typically stored here:

```
name_of_project/
    name_of_app/
        static/
            name_of_app/
                css/
                js/
                images/
        models.py
```

(The names "css", "js" etc aren't important, only their position within the tree.)

Any file within the static folder should be inserted into your HTML using the `{% static %}` tag. More about it: [](static_tag).

### User images

Images uploaded to a Wagtail site by its users (as opposed to a developer's static files, mentioned above) go into the image library and from there are added to pages via the page editor interface.

Unlike other CMSs, adding images to a page does not involve choosing a "version" of the image to use. Wagtail has no predefined image "formats" or "sizes". Instead, the template developer defines image manipulation to occur _on the fly_ when the image is requested, via a special syntax within the template.

Images from the library must be requested using this syntax, but a developer's static images can be added via conventional means like `img` tags. Only images from the library can be manipulated on the fly.

Read more about the image manipulation syntax here: [](image_tag).

(template_tags_and_filters)=

## Template tags & filters

In addition to Django's standard tags and filters, Wagtail provides some of its own, which can be `load`-ed [just like any other](inv:django#howto/custom-template-tags).

## Images (tag)

The `image` tag inserts an XHTML-compatible `img` element into the page, setting its `src`, `width`, `height`, and `alt`. See also [](image_tag_alt).

The syntax for the `image` tag is thus:

```html+django
{% image [image] [resize-rule] %}
```

For example:

```html+django
{% load wagtailimages_tags %}
...

{% image page.photo width-400 %}

<!-- or a square thumbnail: -->
{% image page.photo fill-80x80 %}
```

See [](image_tag) for full documentation.

### Images in multiple formats

The `picture` tag works like `image`, but allows specifying multiple formats to generate a `<picture>` element with `<source>` elements and a fallback `<img>`.

For example:

```html+django
{% load wagtailimages_tags %}
...

{% picture page.photo format-{avif,webp,jpeg} width-400 %}
```

See [](multiple_formats) for full documentation.

### Images in multiple sizes

The `srcset_image` tag works like `image`, but allows specifying multiple sizes to generate a `srcset` attribute and leverage [responsive image rules](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images).

For example:

```html+django
{% load wagtailimages_tags %}
...

{% srcset_image page.photo width-{400,800} sizes="(max-width: 600px) 400px, 80vw" %}
```

This can also be done with `picture`, to generate multiple formats and sizes at once:

```html+django
{% picture page.photo format-{avif,webp,jpeg} width-{400,800} sizes="80vw" %}
```

See [](responsive_images) for full documentation.

(rich_text_filter)=

## Rich text (filter)

The `richtext` filter takes a chunk of HTML content and renders it as safe HTML on the page. Importantly, it also expands internal shorthand references to embedded images and links made in the Wagtail editor, into fully-baked HTML ready for display.

Only fields using `RichTextField` need this applied in the template.

```html+django
{% load wagtailcore_tags %}
...
{{ page.body|richtext }}
```

(responsive_embeds)=

### Responsive Embeds

As Wagtail does not impose any styling of its own on templates, images, and embedded media will be displayed at a fixed width as determined by the HTML. Images can be made to resize to fit their container using a CSS rule such as the following:

```css
.body img {
    max-width: 100%;
    height: auto;
}
```

where `body` is a container element in your template surrounding the images.

Making embedded media resizable is also possible, but typically requires custom style rules matching the media's aspect ratio. To assist in this, Wagtail provides built-in support for responsive embeds, which can be enabled by setting `WAGTAILEMBEDS_RESPONSIVE_HTML = True` in your project settings. This adds a CSS class of `responsive-object` and an inline `padding-bottom` style to the embed, to be used in conjunction with the following CSS:

```css
.responsive-object {
    position: relative;
}

.responsive-object iframe,
.responsive-object object,
.responsive-object embed {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
```

## Internal links (tag)

(pageurl_tag)=

### `pageurl`

Takes a Page object and returns a relative URL (`/foo/bar/`) if within the same Site as the current page, or absolute (`http://example.com/foo/bar/`) if not.

```html+django
{% load wagtailcore_tags %}
...
<a href="{% pageurl page.get_parent %}">Back to index</a>
```

A `fallback` keyword argument can be provided - this can be a URL string, a named URL route that can be resolved with no parameters, or an object with a `get_absolute_url` method, and will be used as a substitute URL when the passed page is `None`.

```html+django
{% load wagtailcore_tags %}

{% for publication in page.related_publications.all %}
    <li>
        <a href="{% pageurl publication.detail_page fallback='coming_soon' %}">
            {{ publication.title }}
        </a>
    </li>
{% endfor %}
```

(fullpageurl_tag)=

### `fullpageurl`

Takes a Page object and returns its absolute URL (`http://example.com/foo/bar/`).

```html+django
{% load wagtailcore_tags %}
...
<meta property="og:url" content="{% fullpageurl page %}" />
```

Much like `pageurl`, a `fallback` keyword argument may be provided.

(slugurl_tag)=

### `slugurl`

Takes any `slug` as defined in a page's "Promote" tab and returns the URL for the matching Page. If multiple pages exist with the same slug, the page chosen is undetermined.

Like `pageurl`, this will try to provide a relative link if possible but will default to an absolute link if the Page is on a different Site. This is most useful when creating shared page furniture, for example, top-level navigation or site-wide links.

```html+django
{% load wagtailcore_tags %}
...
<a href="{% slugurl 'news' %}">News index</a>
```

(static_tag)=

## Static files (tag)

The `static` tag is used to load anything from your static files directory. Use of this tag avoids rewriting all static paths if hosting arrangements change, such as when moving from development to a live environment.

```html+django
{% load static %}
...
<img src="{% static "name_of_app/myimage.jpg" %}" alt="My image"/>
```

Notice that the full path is not required - the path given here is relative to the app's `static` directory. To avoid clashes with static files from other apps (including Wagtail itself), it's recommended to place static files in a subdirectory of `static` with the same name as the app.

## Multi-site support

(wagtail_site_tag)=

### `wagtail_site`

Returns the Site object corresponding to the current request.

```html+django
{% load wagtailcore_tags %}

{% wagtail_site as current_site %}
```

(wagtailuserbar_tag)=

## Wagtail user bar

The `wagtailuserbar` tag provides a contextual flyout menu for logged-in users. The menu gives editors the ability to edit the current page or add a child page, besides the options to show the page in the Wagtail page explorer or jump to the Wagtail admin dashboard.

This tag may be used on standard Django views, without page object. The user bar will contain one item pointing to the admin.

We recommend putting the tag near the top of the `<body>` element to allow keyboard users to reach it. You should consider putting the tag after any [skip links](https://webaim.org/techniques/skipnav/) but before the navigation and main content of your page.

```html+django
{% load wagtailuserbar %}
...
<body>
    <a id="#content">Skip to content</a>
    {% wagtailuserbar %} {# This is a good place for the user bar #}
    <nav>
    ...
    </nav>
    <main id="content">
    ...
    </main>
</body>
```

By default, the user bar appears in the bottom right of the browser window, inset from the edge. If this conflicts with your design it can be moved by passing a parameter to the template tag. These examples show you how to position the user bar in each corner of the screen:

```html+django
...
{% wagtailuserbar 'top-left' %}
{% wagtailuserbar 'top-right' %}
{% wagtailuserbar 'bottom-left' %}
{% wagtailuserbar 'bottom-right' %}
...
```

The user bar can be positioned where it works best with your design. Alternatively, you can position it with a CSS rule in your own CSS files, for example:

```css
wagtail-userbar::part(userbar) {
    bottom: 30px;
}
```

To customize the items shown in the user bar, you can use the [`construct_wagtail_userbar`](construct_wagtail_userbar) hook.

The user bar is also available as a [template component](template_components), which allows it to be rendered independently and [loaded by a headless frontend](headless_user_bar).

## Varying output between preview and live

Sometimes you may wish to vary the template output depending on whether the page is being previewed or viewed live. For example, if you have visitor-tracking code such as Google Analytics in place on your site, it's a good idea to leave this out when previewing, so that editor activity doesn't appear in your analytics reports. Wagtail provides a `request.is_preview` variable to distinguish between preview and live:

```html+django
{% if not request.is_preview %}
    <script>
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        ...
    </script>
{% endif %}
```

If the page is being previewed, `request.preview_mode` can be used to determine the specific preview mode being used,
if the page supports [multiple preview modes](wagtail.models.Page.preview_modes).

(template_fragment_caching)=

## Template fragment caching

Django supports [template fragment caching](<inv:django:std:label#topics/cache:template fragment caching>), which allows caching portions of a template. Using Django's `{% cache %}` tag natively with Wagtail can be [dangerous](https://github.com/wagtail/wagtail/issues/5074) as it can result in preview content being shown to end users. Instead, Wagtail provides 2 extra template tags which can be loaded from `wagtail_cache`:

(wagtailcache)=

### Preview-aware caching

The `{% wagtailcache %}` tag functions similarly to Django's `{% cache %}` tag, but will neither cache nor serve cached content when previewing a page (or other model) in Wagtail.

```html+django
{% load wagtail_cache %}

{% wagtailcache 500 sidebar %}
    <!-- sidebar -->
{% endwagtailcache %}
```

Much like `{% cache %}`, you can use [`make_template_fragment_key`](django.core.cache.utils.make_template_fragment_key) to obtain the cache key.

(wagtailpagecache)=

### Page-aware caching

`{% wagtailpagecache %}` is an extension of `{% wagtailcache %}`, but is also aware of the current `page` and `site`, and includes those as part of the cache key. This makes it possible to easily add caching around parts of the page without worrying about the page it's on. `{% wagtailpagecache %}` intentionally makes assumptions - for more customization it's recommended to use `{% wagtailcache %}`.

```html+django
{% load wagtail_cache %}

{% wagtailpagecache 500 hero %}
    <!-- hero -->
{% endwagtailpagecache %}
```

This is identical to:

```html+django
{% wagtail_site as current_site %}

{% wagtailcache 500 hero page.cache_key current_site.id %}
    <!-- hero -->
{% endwagtailcache %}
```

Note the use of the page's [cache key](page_cache_key), which ensures that when a page is updated, the cache is automatically invalidated.

If you want to obtain the cache key, you can use `make_wagtail_template_fragment_key` (based on Django's [`make_template_fragment_key`](django.core.cache.utils.make_template_fragment_key)):

```python
from django.core.cache import cache
from wagtail.coreutils import make_wagtail_template_fragment_key

key = make_wagtail_template_fragment_key("hero", page, site)
cache.delete(key)  # invalidates cached template fragment
```
