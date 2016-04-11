// dotenv setup
require('dotenv').config();

// module imports

var graph = require('fbgraph');
var fs = require('fs');
var Log = require('log');
var log = new Log('debug');

// constants

LATEST_POST_FILENAME = 'latest_post_id.txt';
SINGLE_REQUEST_MAX_POSTS = '100'; // maximum posts to fetch each time script is run

// configuration of the modules

var access_token = process.env.FB_ACCESS_CODE;
graph.setAccessToken(access_token);



// module begin

var options = {
	timeout: 3000, 
	pool: { maxSockets:  Infinity },
	headers:  { connection:  "keep-alive" }
};

	graph
.setOptions(options)
	.get("/scholarsavenue/posts?limit=" + SINGLE_REQUEST_MAX_POSTS, function(err, posts) {
		if(err) {
			log.error(err);
		} else {
			//log.info(res);
			log.info(posts.data.length + " posts scraped!");

			fs.writeFile('posts.json', posts);

			fs.writeFileSync(LATEST_POST_FILENAME, posts.data[95].id);

			// check for the newer posts as compared to the last scrape
			if(fs.existsSync(LATEST_POST_FILENAME)) {
				latest_post = fs.readFileSync(LATEST_POST_FILENAME).toString();
				log.info(latest_post.length);
				log.info(posts.data[0].id.length);

				if(posts.data[0].id === latest_post) {
					log.info('All the posts scrapped and analysed.');
					process.exit(0);
				} else {
					log.info('New posts since the last scraping output. Checking how many new posts were added since.');

					// get the new posts since the last scrape

					var new_posts_since_last = [];

					for(i=0; posts.data[i].id !== latest_post; ++i) new_posts_since_last.push(posts.data[i]);

					log.info(new_posts_since_last.length + " new posts were found since the last scrape");

					// now find out which of the new posts are actually related to one of the GCs

					var gc_posts = []; // list of the complete post
					var gc_posts_messages = []; // list of status messages only

					// TODO : Move all soc-cult to one regex pattern and remove the which_gc_regex_list
					//	references in the next few sections.
					var which_gc_regex_list = [/Soc-cult/i, 
							/(Social\scultural|Social\s{0,}and\s{0,}cultural)/i,
							/Tech/i,
							/Technology/i,
							/Sports/i,
							/GC/i, 
							];
					var which_gc_regex_list_1 = {
						"soccult": [/Soc-cult/i, /Social\scultural/i, /Social\sand\scultural/i],
						"tech": [/Technology/i, /tech/i],
						"sports": [/Sports/i]
					};

					for(i in new_posts_since_last) {
						for(j in which_gc_regex_list) {
							//log.info(new_posts_since_last[i].message);
							//log.info(typeof(new_posts_since_last[i].message));
							if(new_posts_since_last[i].message) {
								if(new_posts_since_last[i].message.match(which_gc_regex_list[j])) {
									gc_posts.push(new_posts_since_last[i]);
									gc_posts_messages.push(new_posts_since_last[i].message);
									break;
								}
							}
						}
					}

					log.info(gc_posts.length + ' GC posts were found. Written to gc_posts.json.');

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

					log.info(gc_announcements.length + " posts found with GC announcements");

					fs.writeFileSync('gc_announcements.json', gc_announcements);

					// now, in each announcement find the medal winners
					// and the event that it corresponds to

					// list of objects that will contain the event and medal winners
					// each object will have four keys: 
					//	gold
					//	silver
					//	bronze
					//	event
					// All values will be lowercase
					var announcements_to_add = []; 

					var gold = /Gold\s{0,}[:-]\s{0,}([a-z]+)/i;
					var silver = /Silver\s{0,}[:-]\s{0,}([a-z]+)/i;
					var bronze = /Bronze\s{0,}[:-]\s{0,}([a-z]+)/i;

					var socCultEventList = [/cartooning/i, 
							/collaging/i, 
							/postering/i, 
							/thermocol\sand\sclay\smodelling/i,
							/debate/i,
							/(english|hindi|bengali)\selocution/i,
							/(general)?\s{0,}quiz/i, // written both as quiz and general quiz
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
							/water\s{0,}polo/i,
							/badminton/i,
							/lawn\s{0,}tennis/i,
							/table\s{0,}tennis/i,
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
						log.debug("----------------------------");
						message = gc_announcements[i];

						this_announcement_object = {};

						// find the halls that won each of the medals
						// check for the colon and the hyphen regexes,
						// which seem to be the most commonly used by TSA


						regexList = [gold, silver, bronze];

						this_announcement_object["gold"] = message.match(gold)[1];
						this_announcement_object["silver"] = message.match(silver)[1];
						this_announcement_object["bronze"] = message.match(bronze)[1];

						// just for printing to the console

						for(j in regexList) {
							log.debug((j == 0 ? "Gold" : (j == 1 ? "Silver" : "Bronze")) + ": " + message.match(regexList[j])[1]);
						}

						var event_found = false;

						if(message.match(which_gc_regex_list[0]) || message.match(which_gc_regex_list[1])) {
							for(j in socCultEventList) {
								var match_obj = message.match(socCultEventList[j]);
								if(match_obj) {
									log.debug("Event: " + match_obj[0]);
									this_announcement_object["event"] = match_obj[0];
									event_found = true;
									break;
								}
							}
						} else {
							if(message.match(which_gc_regex_list[2]) || message.match(which_gc_regex_list[3])) {
								for(j in techEventList) {
									var match_obj = message.match(techEventList[j])
									if(match_obj) {
										log.debug("Event: " + match_obj[0]);
										this_announcement_object["event"] = match_obj[0];
										event_found = true;
										break;
									}
								}
							} else {
								for(j in sportsEventList) {
									var match_obj = message.match(sportsEventList[j])
									if(match_obj) {
										log.debug("Event: " + match_obj[0]);
										this_announcement_object["event"] = match_obj[0];
										event_found = true;
										break;
									}
								}
							}
						}

						log.debug("----------------------------");

					}

				}

			}
			// write the latest post to the file
			// (this should happen only once)
			fs.writeFileSync(LATEST_POST_FILENAME, posts.data[0].id);
			log.info("Written the latest POST id to the LATEST_POST file");
		}
	});
