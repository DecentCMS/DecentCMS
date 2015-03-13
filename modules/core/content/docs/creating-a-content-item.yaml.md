title: Creating a content item
number: 2

-8<------------------------------------------------------------------

Currently, DecentCMS stores content items in the file system, which
is fine for small sites, and makes editing and deploying them quite
easy, even though there is no admin dashboard yet.
Creating a content item is done by simply creating a file in one of
the supported formats: [JSON][json], [YAML][yaml], and
[Snippable][snippable] [YAML][yaml] + [Markdown][markdown].

The relative path to the file under the site's "content" directory
defines its id, and its URL.
For example,  the file `/sites/default/content/foo/bar/baz.yaml.md`
is available under the `/foo/bar/baz` URL, and that is also its id.

A page will typically have a title and a Markdown body (other
flavors of text are available, if you must).
The content type can be specified under the `meta.type` property.
If it's not specified, it defaults to "page".
A simple page can thus be defined with the following
`filename.yaml.md`:

```yaml+markdown
 title: Foo Bar Baz

 -8<------------------

 Some *Markdown* text.
```

If we wanted to explicitly specify the content type, that becomes:

```yaml+markdown
 title: Foo Bar Baz
 meta:
   type: page

  -8<------------------

 Some *Markdown* text.
```

It is also possible to use a standard [YAML][yaml] file instead of a
[Snippable][snippable] file:

```yaml
title: Foo Bar Baz
body:
  Some *Markdown* text.
```

It can be convenient for larger bodies of text to isolate the body
of the page to a separate file.
This way, there is a `baz.yaml` metadata file, and a
`baz.md` Markdown file:

```yaml
title: Foo Bar Baz
body:
  src: baz.md
```

```markdown
Some *Markdown* text.
```

In this case, the body part, instead of being a simple string, is a
pointer to the Markdown file.

The same thing can be expressed in JSON:

```json
{
  "title": "Foo Bar Baz",
  "body": {
    "src": "baz.md"
  }
}
```

There are plenty of options to define content item files in
DecentCMS, and if that's not enough, there are extensibility points
at every level.

  [json]: http://json.org/
  [yaml]: http://yaml.org/
  [snippable]: https://www.npmjs.com/package/snippable
  [markdown]: https://help.github.com/articles/github-flavored-markdown/
