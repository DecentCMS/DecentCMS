title: Content item identity
number: 10

-8<------------------------------------------------------------------

Identity is a funny thing. It's one of those concepts that we use
all the time, but that are
[tremendously difficult to pin down precisely][philosophy-identity].
To keep things "simple", in philosophy and in physics, it's about
[equivalence relations][equivalence-relation].
[In computer science][digital-identity], it's more like a
[bijection][bijection] between two categories of objects.
The difficulty is that you can only approximate real identity this
way: by definition, an object is only identical to itself.
What we call identity in code really is a proxy for identity, a
substitute for it that usually takes less bits to represent than the
object itself.
The difficulty when building an identity algorithm is twofold: you
need to be able to deterministically extract an id from an object,
and the id needs to be different when the objects are different.
In other words, same yield same ids, and distinct yield distinct ids.
Of course, this can be made more complicated with mutable objects.
The constraints are in fact very close to those of a good hashing
algorithm.

Databases typically solve the problem by *assigning* identity to
objects rather than inferring it.
Uniqueness of ids is the guarantee that distinct objects have
distinct ids because, well, all ids are distinct.
That works well until you need to go beyond the confines of that
particular database, and exchange information with other databases,
with conflict resolution, such as when doing importing and exporting
of contents between web sites.
In those cases, instead of using local integer ids, you need
something really globally unique such as guids, or a concept of
identity that's intrinsic to the object.

In DecentCMS, all content items must have a unique id that is a
human-readable string.
For any content that has a publicly accessible URL, that id is
simply that URL, relative to the site's root.
For other types of items, such as widgets, that id is directly or
indirectly determined by the user, and uniqueness is enforced by
the system.
Global uniqueness is not strictly-speaking guaranteed, but
practically reasonably sure.
Locally, it is guaranteed.

If the id is reasonably derived (for example from the slug), chances
of collision are vanishingly small.
The likelihood that the items are actually the same if their ids are
the same is much higher, which is something you want for
export/import, as you want to be able to import the same item
multiple times and not produce clones doing so.
The chances of collision are actually blown out of proportion: they
are a theoretical possibility, but are actually negligible
in practice.

Identity providing services implement rules to go between item and
identity, so extensible identity collaboration is still achieved,
but instead of having identity map to parts, it maps to types of
content storage.
For example, there is a storage provider for widgets that knows how
to find items with an id that starts with "widget:", and another
that knows where to find items with ids that look like relative URLs
(the default).
Once the system knows where to find the content item, the rest of
the pipeline is indifferent to the type of id that was used, and all
content items are equivalent.

So why not guids? Well, first because guids, sequential or not, are
an abomination.
They are extremely human-unfriendly, and cannot be read, written, or
remembered by humans.
Would you prefer this topic's URL was
ht<span>tp</span>s://decentcms.org/01B4C778-FE90-4E56-A4BE-951719BEFD88,
or even
ht<span>tp</span>s://168.62.43.5/01B4C778-FE90-4E56-A4BE-951719BEFD88
instead of
ht<span>tp</span>s://decentcms.org/docs/architecture/identity?
There's a reason why everyone moved away from that kind of URL and
adopted friendly URL (which is a relatively recent development).

There exist some hybrid approaches where a site accepts any URL that
contains a valid numerical id, and will redirect them to a canonical
form that has a human-readable part.
For example, Stack Overflow will permanently redirect
ht<span>tp</span>://stackoverflow.com/questions/12345678/some-random-slug
to
ht<span>tp</span>://stackoverflow.com/questions/12345678/the-one-true-slug-for-this-question.
This way, it's easy to see what a URL's target page is about, and
search engines can still see a unique resource with a unique URL.
On the other hand, the URL presents to the end user an impenetrable
numerical part that will also cause problems if the contents behind
it needs to be exported and imported between web sites.

This hybrid approach can be implemented in DecentCMS: all that's
prescribed is that the identity is a string.
It is possible to build a route handler that redirects non-canonical
URLs to the canonical one, and that maps canonical URLs to the
content item with the id corresponding to the numerical part of the
URL.

In summary, in DecentCMS, there is only one type of identity, a
string, and it is guaranteed that all content items have a unique
identity.
It's simple, and it works.

  [philosophy-identity]: http://plato.stanford.edu/entries/identity/
  [equivalence-relation]: http://mathworld.wolfram.com/EquivalenceRelation.html
  [digital-identity]: http://en.wikipedia.org/wiki/Digital_identity
  [bijection]: http://en.wikipedia.org/wiki/Bijection
  [stack-overflow]: http://stackoverflow.com/