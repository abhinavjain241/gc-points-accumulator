// dotenv setup
require('dotenv').config();

// module imports

var graph = require('fbgraph');
var fs = require('fs');

// constants

LATEST_POST_FILENAME = 'latest_post_id.txt';
SINGLE_REQUEST_MAX_POSTS = '100'; // maximum posts to fetch each time script is run

// configuration of the modules

var access_token = process.env.FB_ACCESS_CODE;
graph.setAccessToken(access_token);

var options = {
	timeout:  3000, 
	pool: { maxSockets:  Infinity },
	headers:  { connection:  "keep-alive" }
};

	graph
.setOptions(options)
	.get("/scholarsavenue/posts?limit=" + SINGLE_REQUEST_MAX_POSTS, function(err, posts) {
		if(err) {
			console.error(err);
		} else {
			//console.log(res);
			console.log(posts.data.length + " posts scraped!");

			fs.writeFile('posts.json', posts);

			// check for the newer posts as compared to the last scrape
			if(fs.existsSync(LATEST_POST_FILENAME)) {
				latest_post = fs.readFileSync(LATEST_POST_FILENAME).toString();
				console.log(latest_post.length);
				console.log(posts.data[0].id.length);
				if(posts.data[0].id === latest_post) {
					console.log('All the posts scrapped and analysed.');
					process.exit(0);
				} else {
					console.log('New posts since the last scraping output. Checking how many new posts were added since.');

					// get the new posts since the last scrape

					var new_posts_since_last = [];

					for(i=0; posts.data[i].id !== latest_post; ++i) new_posts_since_last.push(posts.data[i]);

					console.log(new_posts_since_last.length + " new posts were found since the last scrape");

					// now find out which of the new posts are actually related to one of the GCs

					var gc_posts = []; // list of the complete post
					var gc_posts_messages = []; // list of status messages only

					for(i in new_posts_since_last) {
						var re_list = [/Soc-cult/i, 
							/GC/i, 
								/Tech/i,
								/Social cultural/i,
								/Technology/i,
								/Sports/i ];
						for(j in re_list) {
							console.log(new_posts_since_last[i].message);
							console.log(typeof(new_posts_since_last[i].message));
							if(new_posts_since_last[i].message) {
								if(new_posts_since_last[i].message.match(re_list[j])) {
									gc_posts.push(new_posts_since_last[i]);
									gc_posts_messages.push(new_posts_since_last[i].message);
									break;
								}
							}
						}
					}

					console.log(gc_posts.length + ' GC posts were found. Written to gc_posts.json.');

					fs.writeFileSync('gc_posts.json', JSON.stringify(gc_posts_messages, null, 4));

					fs.writeFileSync(LATEST_POST_FILENAME, posts.data[0].id);

				}

			}
			// write the latest post to the file
			// (this should happen only once)
			fs.writeFileSync(LATEST_POST_FILENAME, posts.data[0].id);
			console.log("Written the latest POST id to the LATEST_POST file");
		}
	});
