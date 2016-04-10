# gc-points-accumulator _WIP_

> This will probably culminate in an API that can return the points of halls and the results of events, from Facebook posts by Scholars Avenue, Awaaz, etc.

Sample output for now: [here](https://icyflame.github.io/gc-points-accumulator/index.txt)

## TODO

- [x] Scrape posts
- [x] Only analyze the newer posts as compared to the last scrape
- [x] Figure out which posts are related to GC in some way
- [x] Figure out which posts are actual announcements about the results of an event
- [x] Figure out which halls won the Gold, Silver and Bronze medals
- [ ] Figure out the event that a particular post corresponds to (Partially, tech and sports GC left)
- [ ] Depending on the event and the halls that won, calculate and add the points to the appropriate halls
- [ ] Store all this in a DB (?) And expose an API!

## References

- [getting a fb graph api access code](http://stackoverflow.com/a/16054555/2080089)
- [facebook graph api](https://developers.facebook.com/docs/graph-api/using-graph-api)
- [facebook graph api /{page-id} endpoint](https://developers.facebook.com/docs/graph-api/reference/v2.5/page/feed)
- [facebook graph api access codes](https://developers.facebook.com/tools/access_token/)
- [facebook graph api /post endpoint](https://developers.facebook.com/docs/graph-api/reference/v2.5/post)
- [node module for facebook graph api](https://www.npmjs.com/package/fbgraph)
- [node fs module reference](https://nodejs.org/api/fs.html)

## Licence

Licensed under MIT

Copyright (C) 2016  Siddharth Kannan <siddharthkannan@tutanota.com>
