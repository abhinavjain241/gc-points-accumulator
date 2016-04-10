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

			fs.writeFileSync(LATEST_POST_FILENAME, posts.data[95].id);

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
					var re_list = [/Soc-cult/i, 
							/Social\scultural/i,
							/Tech/i,
							/Technology/i,
							/Sports/i,
							/GC/i, 
							];

					for(i in new_posts_since_last) {
						for(j in re_list) {
							//console.log(new_posts_since_last[i].message);
							//console.log(typeof(new_posts_since_last[i].message));
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

					// find the posts that actually make an announcement about medals

					var gc_announcements = [];

					for(i in gc_posts_messages) {
						gold = /Gold/i;
						silver = /Silver/i;
						bronze = /Bronze/i;

						post_message = gc_posts_messages[i];

						if(post_message.match(gold) && post_message.match(silver) && post_message.match(bronze)) {
							gc_announcements.push(post_message);
						}
					}

					console.log(gc_announcements.length + " posts found with GC announcements");

					fs.writeFileSync('gc_announcements.json', gc_announcements);

					// now, in each announcement find the medal winners
					// and the event that it corresponds to

					var gold = /Gold\s{0,}[:-]\s{0,}([a-z]+)/i;
					var silver = /Silver\s{0,}[:-]\s{0,}([a-z]+)/i;
					var bronze = /Bronze\s{0,}[:-]\s{0,}([a-z]+)/i;
					var socCultEventList = [/cartooning/i, 
							/collaging/i, 
							/postering/i, 
							/thermocol\sand\sclay\smodelling/i,
							/debate/i,
							/(english|hindi|bengali)\selocution/i,
							/general\squiz/i,
							/what\'s\sthe\sgood\sword/i,
							/(western|eastern)\s(groups{0,}|vocals{0,}|instrumentals{0,})/i,
							/dumb\scharades/i,
							/choreography/i,
							/(hindi|english|bengali)\sdramatics/i];

					var techEventList = [/opensoft/i,
							/hardware\smodelling/i,
							/chemquest/i,
							/case\sstudy/i,
							/maths\solympiad/i,
							/data\sanalytics/i,
							/tech\squiz/i,
							/biz\squiz/i,
							/product\sdesign/i];

					var sportsEventList = [/athletics/i,
							/aquatics/i,
							/badminton/i,
							/lawn\stennis/i,
							/table\stennis/i,
							/chess/i,
							/bridge/i,
							/basketball/i,
							/cricket/i,
							/hockey/i,
							/squash/i,
							/volleyball/i,
							/weightlifting/i,
							/volleyball/i];

					for(i in gc_announcements) {
						console.log("----------------------------");
						message = gc_announcements[i];

						// find the halls that won each of the medals
						// check for the colon and the hyphen regexes,
						// which seem to be the most commonly used by TSA


						regexList = [gold, silver, bronze];

						for(j in regexList) {
							console.log((j == 0 ? "Gold" : (j == 1 ? "Silver" : "Bronze")) + ": " + message.match(regexList[j])[1]);
						}

						var event_found = false;
						
						if(message.match(regexList[0]) || message.match(regexList[1])) {
						for(j in socCultEventList) {
							if(message.match(socCultEventList[j])) {
								console.log("Event: " + message.match(socCultEventList[j])[0]);
								event_found = true;
								break;
							}
						}
						} else {
							if(message.match(regexList[2]) || message.match(regexList[3])) {
								for(j in techEventList) {
									if(message.match(techEventList[j])) {
										console.log("Event: " + message.match(techEventList[j])[0]);
										event_found = true;
										break;
									}
								}
							} else {
								for(j in sportsEventList) {
									if(message.match(sportsEventList[j])) {
										console.log("Event: " + message.match(sportsEventList[j])[0]);
										event_found = true;
										break;
									}
								}
							}
						}

						if(!event_found) {
							for(j in techEventList) {
								if(message.match(techEventList[j])) {
									console.log("Event: " + message.match(techEventList[j])[0]);
									event_found = true;
									break;
								}
							}
						}
						console.log("----------------------------");

					}

				}

			}
			// write the latest post to the file
			// (this should happen only once)
			fs.writeFileSync(LATEST_POST_FILENAME, posts.data[0].id);
			console.log("Written the latest POST id to the LATEST_POST file");
		}
	});
