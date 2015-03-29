title: Writing documentation
number: 8

-8<------------------------------------------------------------------

Documentation is considered a feature in DecentCMS, and as such, it
is expected that all modules come with tests, API documentation, and
documentation topics.
Documentation, like tests, are part of the same code repository as
the rest of the application or module.

Where to write topics?
----------------------

Because of DecentCMS's modular nature, and to keep modules
self-contained entities, the documentation topics must be included
with the module itself.

There are top-level documentation topics, under `/docs`, that
document features and processes that make sense for DecentCMS as a
whole, and that are not focused at a specific module.
Contributions on top-level topics are welcome, of course.

Documentation for a specific feature must be written in the `/docs`
directory of the module it's a part of.

### Sections

Both under the top-level `/docs` directory, and under modules, it's
possible to organize your topics into sections.
This is done by simply creating subdirectories of the `/docs`
directory.
Each section should have an index topic.
The title of the index topic gives the title of the section.
The name of the section's directory should reflect the title, with
all lower case letters, and dashes instead of spaces.

Index topics
------------

Under each `/docs` directory, and under each section subdirectory,
there must be a `index.yaml.md` file for the index topic.

If the index topic is the only topic in the module or in the section,
it should be an extensive explanation of what the module or section
is about.

If the index is not the only topic, it should summarize the module
or section's purpose, and introduce the other topics under the same
scope.

Format of a topic
-----------------

In principle, any content item format could be used to build
documentation topics.
The preferred format, however, is
[snippable YAML + Markdown][snippable].

The file name should reflect the title of the topic, all in lower
case letters, with dashes instead of spaces.

The [YAML][yaml] header for the topic should have a `title` property,
and a `number` property that determines the order of the topic within
the section or module.

After the `-8<------` separator, the Markdown body of the topic
can be found.

```md
 title: Some topic
 number: 3

 -8<---------------------

 The *body* of the topic.
```

### Style

One of the core principles of Markdown is that it should be human
readable and writable.
You should be able to look at a raw Markdown document and read it
comfortably.
Please be careful, when you write new topics, to keep your Markdown
readable.
Miguel de Icaza has [a great post giving some useful guidelines to
writing good Markdown][markdown-style].

#### Code

An exception to the rules from this post is code snippets: DecentCMS
uses [GitHub-flavored Markdown][markdown], which encourages code to
be enclosed in triple quotes ` ``` ` with a language identifier
attached.
For example, a JavaScript code block can be written this way:

```md
```js
do.something('awesome');
``````

#### Links

External links should be written as named references:

```md
A [link to something][something].
... and then at the end of the topic...
  [something]: http://google.com/something
```

Links to other topics should also be written as named relative URLs:

```md
A [link to topic foo in module bar][foo-bar].
... and then at the end of the topic...
  [foo-bar]: /docs/decent-bar/foo
```

Note how the URL uses the module's full technical name, as declared
in the module's manifest, so that the link will actually work.

API documentation
-----------------

The API documentation is automatically extracted from [JsDoc][jsdoc]
comments in the code.
For that reason, it's important that all public APIs are decorated
with JsDoc comments.

Contributing to existing documentation
--------------------------------------

Documentation is easy to contribute to.
You don't need to know about code repositories, only about
[Markdown][markdown].
Once you've found the topic you want to edit on the web site, click
"Edit this topic".
This will take you to the online editor for that topic, on
[GitHub][github].

You must have a GitHub account in order to be able to make changes.
Sign up if you don't already have one.
Make your changes, enter a short summary of your changes, and click
the "Propose file change", or "Commit changes" button.

This will send a message to the project's maintainers, who will
review your changes, and hopefully accept them.

  [snippable]: https://www.npmjs.com/package/snippable
  [jsdoc]: http://usejsdoc.org/
  [yaml]: http://yaml.org/
  [markdown]: https://help.github.com/articles/github-flavored-markdown/
  [github]: https://github.com
  [markdown-style]: http://tirania.org/blog/archive/2014/Sep.html