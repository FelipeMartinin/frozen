var mostVisitedObj = function () {

	var startedIndexing = false;

	var consts = {
		serviceName: "mostVisited",
		consoleLog: "mostVisited_" + "consoleLog",
		mostVisitedCompareRegex: new RegExp("https|http|://|www.", "ig")
	};

	var OPEN_TYPE = {
		//open_new_tab, open_new_window, open_in_incognito
		open_new_tab: 1,
		open_new_window: 2,
		open_in_incognito: 3
	};

	function consoleLog(msg) {
		conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
	}

	// loader will 'load' items by calling thingToDo for each item,
	// before calling allDone when all the things to do have been done.

	function loader(loaderItems, thingToDo, allDone, afterThumbnailCallback) {
		if (!loaderItems) {
			// nothing to do.
			return;
		}

		if ("undefined" === loaderItems.length) {
			// convert single item to array.
			loaderItems = [loaderItems];
		}

		var count = loaderItems.length;
		if (0 == count) {
			allDone(loaderItems);
		}

		// this callback counts down the things to do.
		var thingToDoCompleted = function () {
			count--;
			if (count == 0) {
				allDone(loaderItems);
			}
		};

		for (var i = 0; i < loaderItems.length; i++) {
			// 'do' each thing, and await callback.
			thingToDo(loaderItems, i, thingToDoCompleted, afterThumbnailCallback);
		}
	}

	function loadImage(loaderItems, i, onComplete, afterThumbnailCallback) {

		conduit.newtab.thumbnails.getImage({ url: loaderItems[i].url }, function (imageUrl, properties) {
			if (properties.favicon) {
				loaderItems[i].favicon = properties.favicon;
			}
			if (properties.logo) {
				loaderItems[i].logo = properties.logo;
			}
			loaderItems[i].image = imageUrl;

			if (properties.afterThumbnail && afterThumbnailCallback)
				afterThumbnailCallback(i, imageUrl, loaderItems[i].url);
			else
				onComplete();

		});
		// notify that we're done.
	}

	function generateTopSiteUrl(url) {
		var newHref = url;
		// Handle file:/// link if needed
		if (url.length > 8 && url.substring(0, 8) == "file:///") {
			newHref = "/html/loadfile.html#" + url;
		}
		return newHref;
	}


	function getTopSites(numberOfItems, callback) {

		if (getHashVar("options")) {
			callback([]);
		}

		// If user's opted to show top site tiles...
		if (localStorage.indexComplete == 1) {
			//if (localStorage.option_showtopsites == 1) {

			if (localStorage.option_pagetilearrangement == "manual") {
				window.tiles = jQuery.parseJSON(localStorage.siteTiles);
				var topSites = [];
				for (var t in window.tiles) {

					topSites.push({ image: null, url: generateTopSiteUrl(window.tiles[t].url), title: window.tiles[t].title, direction: "left" });
				}
				//			if (getHashVar("edittiles") == 1) {
				//				var newScript = document.createElement("script");
				//				newScript.setAttribute('src', '/js/tilemode.js');
				//				document.getElementById('head').appendChild(newScript);
				//			}
				callback(topSites);
			} else {
				chrome.tabs.getAllInWindow(null, function (tabs) {
					window.currentTabs = tabs;
					if (openDb()) {
						window.db.transaction(function (tx) {

							// Get top sites

							// Choose which page tiles to display
							switch (localStorage.option_pagetilearrangement) {
								case "manual":
									break;
								// case: "frecency"                    
								default:
									function processTiles(tx) {

										// Don't fetch file:/// URLs?
										var hideFiles = localStorage.option_hidefiletiles == 1 ? ' url NOT LIKE "file:///%" AND ' : '';

										// Don't fetch pinned URLs?
										var hidePinned = '';
										if (localStorage.option_hidepinnedtiles == 1) {
											for (var t in window.currentTabs) {
												if (window.currentTabs[t].pinned) {
													hidePinned += ' url NOT LIKE "' + explode("#", window.currentTabs[t].url)[0] + '%" AND ';
												}
											}
										}

										// Don't fetch opened URLs?
										var hideOpened = '';
										if (localStorage.option_hideopentiles == 1) {
											for (var ot in window.currentTabs) {
												hideOpened += ' url NOT LIKE "' + explode("#", window.currentTabs[ot].url)[0] + '%" AND ';
											}
										}

										// Get top sites
										var statement = 'select DISTINCT url, title from urls WHERE ' + hideFiles + hidePinned + hideOpened + ' frecency > 0 AND type = 1 AND blacklisted = 0 AND title != "" order by frecency DESC limit ?';
										tx.executeSql(statement, [numberOfItems], function (tx, results) {
											var len = results.rows.length;
											var thumbUrl = '';

											var topSites = [];
											// Create HTML for each site tile
											for (var i = 0; i < len; i++) {
												thumbUrl = results.rows.item(i).url;
												topSites.push({ image: null, url: generateTopSiteUrl(thumbUrl), title: results.rows.item(i).title, direction: "left" });
											}
											callback(topSites);
										});
									}

									if (!localStorage.almostdone || localStorage.almostdone == 1) {
										//tx.executeSql('UPDATE thumbs SET frecency = 0');
										tx.executeSql('SELECT DISTINCT url, title, frecency FROM urls WHERE url NOT LIKE "data:%" AND type = 1 AND title != "" AND blacklisted = 0 ORDER BY frecency DESC LIMIT 30', [], function (tx, results) {
											//                                 var len = results.rows.length, i;
											//                                 if (len > 0) {
											//                                    for (var i = 0; i < len; i++) {
											//                                       tx.executeSql('INSERT OR REPLACE INTO thumbs (url, title, frecency) VALUES (?, ?, ?)', [results.rows.item(i).url, results.rows.item(i).title, results.rows.item(i).frecency]);
											//                                    }
											//                                 }
											localStorage.almostdone = 0;
											processTiles(tx);
										});
									} else {
										processTiles(tx);
									}
									break;
							}
						}, function (t) {
							errorHandler(t, getLineInfo());
						});
					}
				});
			}
			//}
		} else {
			callback([]);
		}
	}

	var addToMostVisited = function (site) {
		//MostVisitedSite object
	};

	var clear = function () {

	};

	function addTypedUrl(url) {
		var md5Url = hex_md5(url);
		window.typedUrls[md5Url] ? window.typedUrls[md5Url]++ : window.typedUrls[md5Url] = 1;
	}

	// Generate a frecency score number for a URL.
	// Scoring derived from https://developer.mozilla.org/en/The_Places_frecency_algorithm
	// Make sure visitItems has been .reverse()'d before calling this function

	function calculateFrecency(visitItems, typedVisitIds) {
		var vi = '';
		var singleVisitPoints = 0;
		var summedVisitPoints = 0;
		var bonus = 0;
		var bucketWeight = 0;
		var days = 0;
		var frecency = -1;

		var TypedVisitIds = [];
		if (typedVisitIds && typedVisitIds.length) {
			typedVisitIds = explode(",", typedVisitIds);
			for (var t in typedVisitIds) {
				if (typedVisitIds[t].length) {
					TypedVisitIds[typedVisitIds[t]] = true;
				}
			}
		}

		// If user has opted to use custom scoring...
		if (localStorage.option_customscoring == 1) {

			// For each sampled recent visits to this URL...
			var totalSampledVisits = Math.min(visitItems.length, localStorage.option_recentvisits);
			for (var x = 0; x < totalSampledVisits; x++) {
				singleVisitPoints = 0;
				bonus = 0;
				bucketWeight = 0;
				days = 0;
				vi = visitItems[x];

				// Determine which bonus score to give
				switch (TypedVisitIds[vi.visitId] ? "typed" : vi.transition) {
					case "link":
						bonus = localStorage.option_frecency_link;
						break;
					case "typed":
						bonus = localStorage.option_frecency_typed;
						break;
					case "auto_bookmark":
						bonus = localStorage.option_frecency_auto_bookmark;
						break;
					case "reload":
						bonus = localStorage.option_frecency_reload;
						break;
					case "start_page":
						bonus = localStorage.option_frecency_start_page;
						break;
					case "form_submit":
						bonus = localStorage.option_frecency_form_submit;
						break;
					case "keyword":
						bonus = localStorage.option_frecency_keyword;
						break;
					case "generated":
						bonus = localStorage.option_frecency_generated;
						break;
					default:
						break;
				}

				// Determine the weight of the score, based on the age of the visit
				days = (date("U") - (vi.visitTime / 1000)) / 86400;
				if (days < localStorage.option_cutoff1) {
					bucketWeight = localStorage.option_weight1;
				} else if (days < localStorage.option_cutoff2) {
					bucketWeight = localStorage.option_weight2;
				} else if (days < localStorage.option_cutoff3) {
					bucketWeight = localStorage.option_weight3;
				} else if (days < localStorage.option_cutoff4) {
					bucketWeight = localStorage.option_weight4;
				} else {
					bucketWeight = localStorage.option_weight5;
				}

				// Calculate the points
				singleVisitPoints = (bonus / 100) * bucketWeight;
				summedVisitPoints = summedVisitPoints + singleVisitPoints;
			}

			// Else, if user has not opted to use custom scoring, just use the defaults...
		} else {
			// For each sampled visit...
			var totalSampledVisits = Math.min(visitItems.length, 10);
			for (var x = 0; x < totalSampledVisits; x++) {
				singleVisitPoints = 0;
				bonus = 0;
				bucketWeight = 0;
				days = 0;
				vi = visitItems[x];

				// Assign bonus score based on visit type
				switch (TypedVisitIds[vi.visitId] ? "typed" : vi.transition) {
					case "link":
						bonus = 100;
						break;
					case "typed":
						bonus = 2000;
						break;
					case "auto_bookmark":
						bonus = 75;
						break;
					// Uncomment if needed                
					/*case "reload":
					break;
					case "start_page":
					break;
					case "form_submit":
					break;
					case "keyword":
					break;
					case "generated":
					break;*/ 
					default:
						break;
				}

				// Assign weight based on visit's age
				days = (date("U") - (vi.visitTime / 1000)) / 86400;
				if (days < 4) {
					bucketWeight = 100;
				} else if (days < 14) {
					bucketWeight = 70;
				} else if (days < 31) {
					bucketWeight = 50;
				} else if (days < 90) {
					bucketWeight = 30;
				} else {
					bucketWeight = 10;
				}

				// Calculate points
				singleVisitPoints = (bonus / 100) * bucketWeight;
				summedVisitPoints = summedVisitPoints + singleVisitPoints;
			}
		}

		// Calculate the frecency score for the URL
		frecency = Math.ceil(visitItems.length * summedVisitPoints / totalSampledVisits);
		return frecency;
	}

	function reapplyKeywords() {
		if (openDb()) {
			window.db.transaction(function (tx) {
				tx.executeSql('SELECT * FROM tags', [], function (tx, results) {
					var len = results.rows.length, i;
					if (len > 0) {
						for (var i = 0; i < len; i++) {
							tx.executeSql('UPDATE urls SET tag = ? WHERE url = ?', [results.rows.item(i).tag, results.rows.item(i).url], [], function (tx, results2) {
								if (results2.rowsAffected == 0) {
									tx.executeSql('DELETE FROM tags WHERE tag = ? AND url = ?', [results.rows.item(i).tag, results.rows.item(i).url]);
								}
							});
						}
					}
				});
			}, function (t) {
				errorHandler(t, getLineInfo());
			});
		}
	}

	// Start the indexing process

	function reindex() {
		window.doneApplyingFrecencyScores = 0;
		if (openDb(true)) {
			$("#addresswrapper").css("cursor", "wait");
			window.indexStatus = "Initiating..."; // Step 1
			conduit.newtab.chromeSendMessage({ type: "currentStatus", status: "Initiating...", step: 1 }); // Step 1
			index();
		}
	}

	// Starts the indexing process.

	function beginIndexing() {
		window.reindexing = true;
		localStorage.indexComplete = 0;
		consoleLog("Indexing has begun.");
		reindex();
	}


	//// Update top sites (one at a time) with fresh frecency scores

	function updateTopSites() {
		//   // FIXME: Disabled in v1.2.0. Need to develop a better method of recalculating the top scores.
		//   /*if (openDb()) {
		//   window.db.readTransaction(function(tx){
		//   tx.executeSql('SELECT url FROM urls WHERE type = 1 ORDER BY frecency DESC LIMIT 50', [], function(tx, results){
		//   var len = results.rows.length, i;
		//   if (len > 0) {
		//   window.topUrls = new Array;
		//   var url = '';
		//   for (var i = 0; i < len; i++) {
		//   window.topUrls[window.topUrls.length] = results.rows.item(i).url;
		//   }
		//   updateTopUrl();
		//   }
		//   });
		//   }, function(t){
		//   errorHandler(t, getLineInfo());
		//   });
		//   }*/
	}

	// Index Chrome's data.

	function index() {
		var startTime = date("U");
		if (openDb(true)) {
			var urls = [];
			var insertedUrls = [];
			var tags = [];
			var toInsert = { tags: [], searchEngines: [], historyItems: [], bookmarks: [], frecencyScores: [], totalUrls: 0 };
			var unvisitedBookmarkScore = localStorage.option_frecency_unvisitedbookmark;

			// Create a temp function similar to calculateFrecency(), but without some of the checks and localStorage calls so that it goes faster
			var fLink = 100;
			var fTyped = 2000;
			var fAutoBookmark = 75;
			var fReload = 0;
			var fStartPage = 0;
			var fFormSubmit = 0;
			var fKeyword = 0;
			var fGenerated = 0;
			var fCutoff1 = 4;
			var fCutoff2 = 14;
			var fCutoff3 = 31;
			var fCutoff4 = 90;
			var fWeight1 = 100;
			var fWeight2 = 70;
			var fWeight3 = 50;
			var fWeight4 = 30;
			var fWeight5 = 10;
			var fRecentVisits = localStorage.option_recentvisits;
			if (localStorage.option_customscoring == 1) {
				fLink = localStorage.option_frecency_link;
				fTyped = localStorage.option_frecency_typed;
				fAutoBookmark = localStorage.option_frecency_auto_bookmark;
				fReload = localStorage.option_frecency_reload;
				fStartPage = localStorage.option_frecency_start_page;
				fFormSubmit = localStorage.option_frecency_form_submit;
				fKeyword = localStorage.option_frecency_keyword;
				fGenerated = localStorage.option_frecency_generated;
				fCutoff1 = localStorage.option_cutoff1;
				fCutoff2 = localStorage.option_cutoff2;
				fCutoff3 = localStorage.option_cutoff3;
				fCutoff4 = localStorage.option_cutoff4;
				fWeight1 = localStorage.option_weight1;
				fWeight2 = localStorage.option_weight2;
				fWeight3 = localStorage.option_weight3;
				fWeight4 = localStorage.option_weight4;
				fWeight5 = localStorage.option_weight5;
			}
			var calcScore = function (visitItems, typedVisitIds) {
				var vi = '';
				var singleVisitPoints = 0;
				var summedVisitPoints = 0;
				var bonus = 0;
				var bucketWeight = 0;
				var days = 0;

				var TypedVisitIds = [];
				if (typedVisitIds && typedVisitIds.length) {
					typedVisitIds = explode(",", typedVisitIds);
					for (var t in typedVisitIds) {
						if (typedVisitIds[t].length) {
							TypedVisitIds[typedVisitIds[t]] = true;
						}
					}
				}

				// For each sampled recent visits to this URL...
				var totalSampledVisits = Math.min(visitItems.length, fRecentVisits);
				for (var x = 0; x < totalSampledVisits; x++) {
					singleVisitPoints = 0;
					bonus = 0;
					bucketWeight = 0;
					days = 0;
					vi = visitItems[x];

					// Determine which bonus score to give
					switch (TypedVisitIds[vi.visitId] ? "typed" : vi.transition) {
						case "link":
							bonus = fLink;
							break;
						case "typed":
							bonus = fTyped;
							break;
						case "auto_bookmark":
							bonus = fAutoBookmark;
							break;
						case "reload":
							bonus = fReload;
							break;
						case "start_page":
							bonus = fStartPage;
							break;
						case "form_submit":
							bonus = fFormSubmit;
							break;
						case "keyword":
							bonus = fKeyword;
							break;
						case "generated":
							bonus = fGenerated;
							break;
						default:
							break;
					}

					// Determine the weight of the score, based on the age of the visit
					days = (date("U") - (vi.visitTime / 1000)) / 86400;
					if (days < fCutoff1) {
						bucketWeight = fWeight1;
					} else if (days < fCutoff2) {
						bucketWeight = fWeight2;
					} else if (days < fCutoff3) {
						bucketWeight = fWeight3;
					} else if (days < fCutoff4) {
						bucketWeight = fWeight4;
					} else {
						bucketWeight = fWeight5;
					}

					// Calculate the points
					singleVisitPoints = (bonus / 100) * bucketWeight;
					summedVisitPoints = summedVisitPoints + singleVisitPoints;
				}

				// Calculate and return the frecency score for the URL
				return Math.ceil(visitItems.length * summedVisitPoints / totalSampledVisits);
			};

			// Get tags/keywords for URLs
			if (localStorage.backup_tags && localStorage.backup_tags.length) {
				consoleLog("Fetching URL keywords");
				var lsTags = jQuery.parseJSON(localStorage.backup_tags);
				for (var t in lsTags) {
					toInsert.tags[toInsert.tags.length] = lsTags[t];
					tags[hex_md5(lsTags[t].url)] = lsTags[t];
				}
			}

			// Get search engines
			if (localStorage.backup_searchEngines || localStorage.indexedbefore == 0 || (localStorage.issue47 && localStorage.issue47 == 1)) {
				consoleLog("Fetching search engines");
				if (localStorage.backup_searchEngines && localStorage.backup_searchEngines.length) {
					var engines = jQuery.parseJSON(localStorage.backup_searchEngines);
					for (var e in engines) {
						toInsert.searchEngines[toInsert.searchEngines.length] = engines[e];
					}
				} else {
					toInsert.searchEngines = [
                        { shortname: "Google", iconurl: "google.ico", searchurl: "http://www.google.com/search?q={searchTerms}", xmlurl: "", xml: "", isdefault: 1, method: "get", suggestUrl: "http://suggestqueries.google.com/complete/search?output=firefox&q={searchTerms}", keyword: "g" },
                        { shortname: "Yahoo!", iconurl: "yahoo.ico", searchurl: "http://search.yahoo.com/search?p={searchTerms}", xmlurl: "", xml: "", isdefault: 0, method: "get", suggestUrl: "http://ff.search.yahoo.com/gossip?output=fxjson&amp;command={searchTerms}", keyword: "y" },
                        { shortname: "Bing", iconurl: "bing.ico", searchurl: "http://www.bing.com/search?q={searchTerms}", xmlurl: "", xml: "", isdefault: 0, method: "get", suggestUrl: "http://api.bing.com/osjson.aspx?query={searchTerms}", keyword: "b" }
                    ];
				}
			}

			// Get history
			consoleLog("Fetching history items");
			window.indexStatus = "Gathering your history items and bookmarks..."; // Step 2
			conduit.newtab.chromeSendMessage({ type: "currentStatus", status: "Gathering your history items and bookmarks...", step: 2 }); // Step 2

			window.currentStep = 2;
			var broadcastProgress = setTimeout(function () {
				conduit.newtab.chromeSendMessage({ type: "currentStatus", status: window.indexStatus, step: window.currentStep }); // Step 2
			}, 500);


			// To look for history items visited in the 3 months,
			// subtract a week of microseconds from the current time.
			var microseconds = 1000 * 60 * 60 * 24 * 90;
			var daysAgo = (new Date).getTime() - microseconds;


			chrome.history.search({ text: "", startTime: daysAgo, maxResults: 5000000 }, function (historyItems) {
				toInsert.historyItems = historyItems;
				for (var h in historyItems) {
					var fixedUrl = historyItems[h].url.replace(consts.mostVisitedCompareRegex, '');
					if (insertedUrls.indexOf(fixedUrl) == -1) {
						urls[urls.length] = historyItems[h].url;
						insertedUrls[insertedUrls.length] = fixedUrl;
					} else {
						//console.log("found already " + fixedUrl);
					}
				}
				// Get bookmarks
				consoleLog("Fetching bookmarks");
				window.indexStatus = "Gathering your history items and bookmarks..."; // Step 3
				conduit.newtab.chromeSendMessage({ type: "currentStatus", status: "Gathering your history items and bookmarks...", step: 3 }); // Step 3
				window.currentStep++;
				chrome.bookmarks.getTree(function (nodes) {
					var indexBookmarks = function (nodes) {
						if (nodes.length) {
							for (var n in nodes) {
								toInsert.bookmarks[toInsert.bookmarks.length] = nodes[n];
								if (nodes[n].url) {
									urls[urls.length] = nodes[n].url;
								}
								if (nodes[n].children) {
									indexBookmarks(nodes[n].children);
								}
							}
						}
					};
					indexBookmarks(nodes);
					// Frecency scores
					toInsert.totalUrls = urls.length;
					var calcMsg = "Calculating frecency scores for " + number_format(toInsert.totalUrls) + " different URLs...";
					consoleLog(calcMsg);
					window.indexStatus = calcMsg; // Step 4
					conduit.newtab.chromeSendMessage({ type: "currentStatus", status: calcMsg, step: 4 }); // Step 4
					window.currentStep++;
					var frecencyScoresMD5d = 0;
					var titles = [];
					var typedVisitIds = [];
					window.db.transaction(function (tx) {
						// type1 = history item, type2 = bookmark
						tx.executeSql('CREATE TABLE IF NOT EXISTS urls (url TEXT, type NUMERIC, title TEXT, frecency NUMERIC DEFAULT -1, queuedfordeletion NUMERIC DEFAULT 0, id NUMERIC DEFAULT 0, tag TEXT DEFAULT "", typedVisitIds TEXT DEFAULT "", parentId NUMERIC DEFAULT -1, blacklisted NUMERIC DEFAULT 0)');
						tx.executeSql('SELECT url, title, typedVisitIds FROM urls WHERE type = 1', [], function (tx, places) {
							if (places.rows.length) {
								for (var x = 0; x < places.rows.length; x++) {
									var place = places.rows.item(x);
									titles[hex_md5(place.url)] = place.title;
									typedVisitIds[hex_md5(place.url)] = place.typedVisitIds;
								}
							}
						});
					}, function (t) {
						errorHandler(t, getLineInfo());
					}, function () {
						var calculateScoresAndFinish = function (url) {
							chrome.history.getVisits({ url: url }, function (visits) {
								var md5Url = hex_md5(url);
								try {
									visits.reverse();
									toInsert.frecencyScores[md5Url] = calcScore(visits, typedVisitIds[md5Url] ? typedVisitIds[md5Url] : '');
									frecencyScoresMD5d++;
								} catch (e) {

								}
								// Insert everything into database if ready
								if (toInsert.totalUrls == frecencyScoresMD5d) {
									window.db.transaction(function (tx) {

										// Create tables and indices
										consoleLog("Creating database tables");

										tx.executeSql('DROP TABLE IF EXISTS urls');
										// type1 = history item, type2 = bookmark
										tx.executeSql('CREATE TABLE IF NOT EXISTS urls (url TEXT, type NUMERIC, title TEXT, frecency NUMERIC DEFAULT -1, queuedfordeletion NUMERIC DEFAULT 0, id NUMERIC DEFAULT 0, tag TEXT DEFAULT "", typedVisitIds TEXT DEFAULT "", parentId NUMERIC DEFAULT -1, blacklisted NUMERIC DEFAULT 0)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS urlindex ON urls (url)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS titleindex ON urls (title)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS frecencyindex ON urls (frecency)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS idindex ON urls (id)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS typeindex ON urls (type)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS tagindex ON urls (tag)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS parentIdIndex ON urls (parentId)');

										if (localStorage.issue47 == 1) {
											tx.executeSql('DROP TABLE IF EXISTS errors');
										}
										tx.executeSql('CREATE TABLE IF NOT EXISTS errors (id INTEGER PRIMARY KEY, date NUMERIC, version TEXT, url TEXT, file TEXT, line NUMERIC, message TEXT, count NUMERIC)');

										if (toInsert.tags.length || localStorage.indexedbefore == 0) {
											tx.executeSql('DROP TABLE IF EXISTS tags');
										}
										tx.executeSql('CREATE TABLE IF NOT EXISTS tags (url TEXT DEFAULT "", tag TEXT DEFAULT "")');
										tx.executeSql('CREATE INDEX IF NOT EXISTS tagurlindex ON tags (url)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS tagtagindex ON tags (tag)');

										if (localStorage.issue47 == 1) {
											tx.executeSql('DROP TABLE IF EXISTS inputurls');
										}
										tx.executeSql('CREATE TABLE IF NOT EXISTS inputurls (input TEXT, url TEXT)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS inputindex ON inputurls (input)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS urlindex ON inputurls (url)');

										//                           if (localStorage.issue47 == 1) {
										//                              tx.executeSql('DROP TABLE IF EXISTS thumbs');
										//                           }
										//                           tx.executeSql('CREATE TABLE IF NOT EXISTS thumbs (url TEXT UNIQUE ON CONFLICT REPLACE, data BLOB, date INTEGER, title TEXT, frecency NUMERIC DEFAULT -1, manual NUMERIC DEFAULT 0)'); // "manual" meaning, is the thumb a user-defined site tile, not necessarily a top frecency scored one
										//                           tx.executeSql('CREATE INDEX IF NOT EXISTS urlindex ON thumbs (url)');
										//                           tx.executeSql('CREATE INDEX IF NOT EXISTS frecencyindex ON thumbs (frecency)');

										if (toInsert.searchEngines.length || localStorage.issue47 == 1) {
											tx.executeSql('DROP TABLE IF EXISTS opensearches');
										}
										tx.executeSql('CREATE TABLE IF NOT EXISTS opensearches (shortname TEXT UNIQUE ON CONFLICT REPLACE, iconurl TEXT, searchurl TEXT, xmlurl TEXT, xml TEXT, isdefault NUMERIC DEFAULT 0, method TEXT DEFAULT "get", position NUMERIC DEFAULT 0, suggestUrl TEXT, keyword TEXT DEFAULT "")');

										if (localStorage.issue47 == 1) {
											tx.executeSql('DROP TABLE IF EXISTS searchqueries');
										}
										tx.executeSql('CREATE TABLE IF NOT EXISTS searchqueries (id INTEGER PRIMARY KEY AUTOINCREMENT, query TEXT)');
										tx.executeSql('CREATE INDEX IF NOT EXISTS queryindex ON searchqueries (query)');

										if (toInsert.tags.length) {
											consoleLog("Inserting " + number_format(toInsert.tags.length) + " URL keywords");
											for (var t in toInsert.tags) {
												tx.executeSql('INSERT INTO tags (url, tag) VALUES (?, ?)', [toInsert.tags[t].url, toInsert.tags[t].tag]);
											}
										}

										if (toInsert.searchEngines.length) {
											consoleLog("Inserting " + number_format(toInsert.searchEngines.length) + " search engines");
											for (var en in toInsert.searchEngines) {
												var e = toInsert.searchEngines[en];
												tx.executeSql('INSERT INTO opensearches (shortname, iconurl, searchurl, xmlurl, xml, isdefault, method, suggestUrl, keyword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                                    [e.shortname, e.iconurl, e.searchurl, e.xmlurl, e.xml, e.isdefault, e.method, e.suggestUrl, e.keyword]);
											}
										}

										var historyMsg = "Adding " + number_format(toInsert.historyItems.length) + " history items to database...";
										consoleLog(historyMsg);
										window.indexStatus = historyMsg; // Step 5
										conduit.newtab.chromeSendMessage({ type: "currentStatus", status: historyMsg, step: 5 }); // Step 5
										window.currentStep++;
										for (var h in toInsert.historyItems) {
											var hI = toInsert.historyItems[h];
											md5Url = hex_md5(hI.url);
											tx.executeSql(
                                                'INSERT INTO urls (type, url, title, frecency, typedVisitIds, tag) VALUES (?, ?, ?, ?, ?, ?)',
                                                [1, hI.url, titles[md5Url] ? titles[md5Url] : hI.title, toInsert.frecencyScores[md5Url], typedVisitIds[md5Url] ? typedVisitIds[md5Url] : '', tags[md5Url] ? tags[md5Url].tag : '']
                                            );
										}
										var bookmarkMsg = "Adding " + number_format(toInsert.bookmarks.length) + " bookmarks to database...";
										consoleLog(bookmarkMsg);
										window.indexStatus = bookmarkMsg; // Step 6
										conduit.newtab.chromeSendMessage({ type: "currentStatus", status: bookmarkMsg, step: 6 }); // Step 6
										window.currentStep++;
										for (var b in toInsert.bookmarks) {
											var bm = toInsert.bookmarks[b];
											if (bm.url) {
												md5Url = hex_md5(bm.url);
											}
											tx.executeSql(
                                                'INSERT INTO urls (id, type, parentId, url, title, frecency, typedVisitIds, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                                                [bm.id ? bm.id : 0, 2, bm.parentId ? bm.parentId : 0, bm.url ? bm.url : "", bm.title ? bm.title : "", bm.url ? (toInsert.frecencyScores[md5Url] ? toInsert.frecencyScores[md5Url] : unvisitedBookmarkScore) : -1, typedVisitIds[md5Url] ? typedVisitIds[md5Url] : "", tags[md5Url] ? tags[md5Url].tag : '']
                                            );
										}
										tx.executeSql('DELETE FROM urls WHERE url LIKE "data:%" OR url LIKE "javascript:void%"');
										consoleLog("Saving");
										window.indexStatus = "Saving..."; // Step 7
										conduit.newtab.chromeSendMessage({ type: "currentStatus", status: "Saving...", step: 7 }); // Step 7
										window.currentStep++;
										clearTimeout(broadcastProgress);
									}, function (t) {
										errorHandler(t, getLineInfo());
									}, function () {
										var secs = parseFloat(date("U")) - parseFloat(startTime);
										window.reindexing = false;
										localStorage.indexComplete = 1;
										localStorage.issue47 = 0;
										localStorage.almostdone = 1;
										localStorage.needToReindex = 0;
										delete localStorage.needToReindex;
										consoleLog("Indexing complete! Took " + secs + " seconds.");
										conduit.newtab.chromeSendMessage({ type: "currentStatus", status: "Indexing complete.", step: 8 }); // Step 8
										setTimeout(function () {
											//                                 if (localStorage.indexedbefore != 1) {
											//                                    var f = localStorage.extensionName ? localStorage.extensionName : "Unknown";
											//                                    window.webkitNotifications.createHTMLNotification('/html/notification_setupComplete.html').show();
											//                                 }
											localStorage.indexedbefore = 1;
											delete localStorage.reindexForMaintenance;
											updateTopSites();
											conduit.newtab.chromeSendMessage({ type: "DONE INDEXING" });
										}, 1200);
									});
								}
							});
						};
						if (urls.length) {
							while (urls.length) {
								calculateScoresAndFinish(urls.pop());
							}
						} else {
							calculateScoresAndFinish('');
						}
					});
				});
			});
		}
	}

	function onRequestListener(request, sender) {

		// Generate top site tile thumbnail for page if page reports page has not been scrolled at all
		if (request == "scrolltop is 0") {
			captureScreenshot(sender);
		}

		// Backup keywords to localStorage in case database becomes corrupted
		else if (request == "backup keywords") {
			backupKeywords();
		}

		// Backup search engines to localStorage in case database becomes corrupted
		else if (request == "backup search engines") {
			backupSearchEngines();
		}

		// Record what the user typed to go to a URL, to help out the pre-rendering guesswork
		else if (request.action && request.action == "record input url") {
			if (localStorage.option_prerender == 1 && openDb()) {
				window.db.transaction(function (tx) {
					tx.executeSql('DELETE FROM inputurls WHERE input = ?', [request.input.toLowerCase()]);
					tx.executeSql('INSERT INTO inputurls (input, url) VALUES (?, ?)', [request.input.toLowerCase(), request.url]);
				}, function (t) {
					errorHandler(t, getLineInfo());
				});
			}
		}

		// Get ready to record next visit to a URL as a "typed" transition instead of "link"
		else if (request.action && request.action == "add typed visit id") {
			addTypedUrl(request.url);
		}

		// Pre-rendered page is being navigated to, so let's process it in a moment
		else if (request == "process prerendered page") {

			// Tab ID changes with prerendering (even though it's the same tab...), so need to get new ID via getSelected()
			setTimeout(function () {
				chrome.tabs.getSelected(null, function (tab) {
					processUpdatedTab(tab.id, tab);
					captureScreenshot(sender);
				});
			}, 500);
		}

		// Request received to do the indexing process
		else if (request.action && request.action == "reindex") {
			setTimeout(beginIndexing, 100);
		}

		// Chrome sometimes truncates page titles for its history items. Don't know why.
		// So, have update it's own database with proper, updated current titles.
		else if (request.action && request.action == "updateUrlTitles") {
			if (openDb()) {
				window.db.transaction(function (tx) {
					tx.executeSql('UPDATE urls SET title = ? WHERE url = ? AND type = 1', [request.urltitle, request.url]);
					//tx.executeSql('UPDATE thumbs SET title = ? WHERE url = ?', [request.urltitle, request.url]);
				}, function (t) {
					errorHandler(t, getLineInfo());
				});
			}
		}
	}

	function historyOnVisitRemoved(removed) {
		if (openDb()) {

			// If user has chosen to remove their entire history from Chrome, do the same to database's index
			if (removed.allHistory) {
				consoleLog("Removing all history URLs!");
				window.db.transaction(function (tx) {
					tx.executeSql('DELETE FROM urls WHERE type = 1');
					//tx.executeSql('UPDATE thumbs SET frecency = -1');
					//tx.executeSql('UPDATE thumbs SET frecency = -2 WHERE manual != 1');
					tx.executeSql('UPDATE urls SET frecency = ? WHERE type = 2', [localStorage.option_frecency_unvisitedbookmark]);
					tx.executeSql('DELETE FROM inputurls');
				}, function (t) {
					errorHandler(t, getLineInfo());
				});
			}

			// But if all visits of specific URLs have been removed, delete them from database index
			else {
				window.db.transaction(function (tx) {
					for (var r in removed.urls) {
						tx.executeSql('DELETE FROM urls WHERE type = 1 AND url = ?', [removed.urls[r]]);
						//tx.executeSql('UPDATE thumbs SET frecency = -1 WHERE url = ?', [removed.urls[r]]);
						//tx.executeSql('UPDATE thumbs SET frecency = -2 WHERE url = ? AND manual != 1', [removed.urls[r]]);
						tx.executeSql('UPDATE urls SET frecency = ? WHERE url = ? AND type = 2', [localStorage.option_frecency_unvisitedbookmark, removed.urls[r]]);
						tx.executeSql('DELETE FROM inputurls WHERE url = ?', [removed.urls[r]]);
					}
				}, function (t) {
					errorHandler(t, getLineInfo());
				});
			}
		}
	}


	function historyOnVisited(historyItem) {

		// If the visit is to our extension page, remove it from Chrome's history. Don't need to litter the user's history with every instance that new tab is opened when they open a new tab.
		if (strstr(historyItem.url, chrome.extension.getURL(""))) {
			chrome.history.deleteUrl({ url: historyItem.url });
		}

		// If the visit is a pure data source, like maybe viewing an inline image, don't add it to database; it'll slow database down too much. Plus it acts as a titleless result, which isn't very helpful.
		else if (historyItem.url.substr(0, 5) == 'data:') {
			return false;
		}

		// Otherwise, we want to add the visit to database...
		else if (openDb()) {

			// DEV: While browsing, inspect background.html console to view visit objects.
			// Useful for determining what visit transition types Chrome uses.
			/*chrome.history.getVisits({url:historyItem.url}, function(visits){
			consoleLog(visits[visits.length-1]);
			});*/

			var addVisit = function (visitId) {
				window.db.readTransaction(function (tx) {

					// See if it exists...
					tx.executeSql('SELECT url FROM urls WHERE url = ? AND type = 1 AND queuedfordeletion = 0 LIMIT 1', [historyItem.url], function (tx, results) {
						var len = results.rows.length, i;

						// If URL doesn't exist in database, add it
						if (len == 0) {
							chrome.history.getVisits({ url: historyItem.url }, function (visitItems) {
								visitItems.reverse();
								if (1 == 1 || visitItems[0].transition != 'auto_subframe') {
									window.db.transaction(function (tx) {
										var frecency = calculateFrecency(visitItems, visitId);
										tx.executeSql('INSERT OR REPLACE INTO urls (url, type, title, frecency, queuedfordeletion, typedVisitIds) VALUES (?, ?, ?, ?, ?, ?)', [historyItem.url, 1, historyItem.title, frecency, 0, visitId]);
										tx.executeSql('UPDATE urls SET frecency = ?, typedVisitIds = (typedVisitIds||?) WHERE url = ?', [frecency, visitId, historyItem.url]);
										//tx.executeSql('UPDATE thumbs SET frecency = ? WHERE url = ?', [frecency, historyItem.url]);
									}, function (t) {
										errorHandler(t, getLineInfo());
									}, reapplyKeywords);
								}
							});
						}

						// If URL *does* exist, update it with a new frecency score
						else {
							chrome.history.getVisits({ url: historyItem.url }, function (visitItems) {
								visitItems.reverse();
								window.db.transaction(function (tx) {
									tx.executeSql('SELECT typedVisitIds FROM urls WHERE url = ? LIMIT 1', [historyItem.url], function (tx, results) {
										var frecency = calculateFrecency(visitItems, results.rows.length ? results.rows.item(0).typedVisitIds + visitId : visitId);
										tx.executeSql('UPDATE urls SET frecency = ?, typedVisitIds = (typedVisitIds||?) WHERE url = ?', [frecency, visitId, historyItem.url]);
										tx.executeSql('UPDATE urls SET title = ? WHERE url = ? AND type = 1', [historyItem.title, historyItem.url]);
										//tx.executeSql('UPDATE thumbs SET title = ?, frecency = ? WHERE url = ?', [historyItem.title, frecency, historyItem.url]);
									});
								}, function (t) {
									errorHandler(t, getLineInfo());
								}, reapplyKeywords);
							});
						}
						tx.executeSql('SELECT frecency FROM urls WHERE type = 1 ORDER BY frecency DESC LIMIT 50,50', [], function (tx, results) {
							if (results.rows.length > 0) {
								window.frecencyThreshold = results.rows.item(0).frecency;
							} else {
								window.frecencyThreshold = 75;
							}
						});
					});
				}, function (t) {
					errorHandler(t, getLineInfo());
				}, function () {
					/*
					_Sometimes_ when visiting a page, Chrome only records the URL and not the title.
					And pre-rendered pages don't seem to trigger chrome.tabs.onUpdated().
					And the updatetitle.js content script won't really work if Chrome thinks the document's title is blank when it gets fired;
					not sure if manifest-listed content scripts get injected for pre-rendered pages, either.
					So it's possible that a titleless page gets added to database(even though it's not actually titleless), and certain legit titleless pages might get
					filtered out with option "Don't show dynamically-generated untitled results" option.
					So if title is blank, check for it in a moment (assumes visited page in question is the selected tab).
					This addition (added in 1.1.1) means that now attempts to check for and update titles:
					1. On page visited
					2. On tab updated
					3. When page gets loaded (title fetched using manifest-listed injected content script)
					4. Momentarily after page gets visited (if it's blank)
					*/
					if (!historyItem.title || !historyItem.title.length) {
						chrome.tabs.getSelected(null, function (tab) {
							window.db.transaction(function (tx) {
								tx.executeSql('UPDATE urls SET title = ? WHERE type = 1 AND url = ?', [tab.title, tab.url]);
								//tx.executeSql('UPDATE thumbs SET title = ? WHERE url = ?', [tab.title, tab.url]);
							}, function (t) {
								errorHandler(t, getLineInfo());
							});
						});
					}
				});
			};

			if (historyItem.url) {
				var md5Url = hex_md5(historyItem.url);
			}
			if (historyItem.url && window.typedUrls[md5Url]) {
				window.typedUrls[md5Url]--;
				//consoleLog('Counting visit as "typed" for '+historyItem.url);
				chrome.history.getVisits({ url: historyItem.url }, function (visits) {
					addVisit(visits.length ? visits[visits.length - 1].visitId + ',' : '');
				});
			} else {
				addVisit('');
			}
		}
	}

	//-------------------------------------------------------------------------
	// developerMode
	//-------------------------------------------------------------------------

	function setManualRefreshInterval(value) {

		// KobyM - TBD

	}

	function getManualRefreshInterval() {

		// KobyM - TBD

	}

	var developerMode = {
		getManualRefreshInterval: getManualRefreshInterval,
		setManualRefreshInterval: setManualRefreshInterval
	};


	var obj = {
		init: function () {
			try {

				// When Chrome adds a page visit to its history index, update database index with this information.
				// note: Chrome adds a "visit" as soon as the page starts loading. But this happens before the <title> tag is read, and so visits sometimes aren't recorded with a title in Chrome's history the first time they're loaded.
				chrome.history.onVisited.addListener(historyOnVisited);


				// When Chrome deletes its history...
				// if ALL of Chrome's history has been removed, or if all visits of a unique URL have been removed, this function gets called.
				// But this function does *not* get called if only a few visits of a URL get removed.
				// eg, if you visit a URL every hour in a day, and then tell Chrome to delete your past hour of history, this function will not get called because visits of the URL still remain for the other 23 hours.
				chrome.history.onVisitRemoved.addListener(historyOnVisitRemoved);


				// Background page listens for requests...
				//conduit.newtab.chromeMessageListender(onRequestListener);

				return (localStorage.indexComplete == 1);
			} catch (e) {
				exceptionHandler(e, getLineInfo());
				return false;
			}

		},
		StartIndexingService: function () {

			try {
				if (!startedIndexing) {

					conduit.newtab.initConsoleLog(consts.consoleLog);
					consoleLog("init - Indexing Service");

					// Array to hold which URLs to record as "typed" transitions
					window.typedUrls = [];

					// Open a new tab if the indexing needs to be done
					if (localStorage.indexComplete != 1) {

						//index();
						setTimeout(function () {
							beginIndexing();
						}, 1000);

						//      chrome.tabs.create({ selected: true, url: chrome.extension.getURL("NewTabPages/new_tab.html") }, function () {
						//         // User probably disabled/re-enabled extension during an indexing session, so start indexing again
						//         if (localStorage.indexedbefore == 1 && !localStorage.reindexForMaintenance) {
						//            index();
						//         }
						//      });

						// Otherwise update top 50 sites with fresh frecency scores if top scores are older than 2 hours
					}
					startedIndexing = true;
				}
				return true;
			} catch (e) {
				exceptionHandler(e, getLineInfo());
				return false;
			}
		},

		getMostVisited: function (numberOfItems, callback, afterThumbnailCallback) {

			getTopSites(numberOfItems, function (topSites) {

				loader(topSites, loadImage, callback, afterThumbnailCallback);
			});


		},

		openSite: function (url, openType) {
			//open_new_tab, open_new_window, open_in_incognito

			switch (openType) {
				case OPEN_TYPE.open_new_tab:
					{
						chrome.tabs.create({ url: url, selected: true });
						break;
					}
				case OPEN_TYPE.open_new_window:
					{
						chrome.windows.create({ url: [url] });
						break;
					}
				case OPEN_TYPE.open_in_incognito:
					{
						chrome.windows.create({ url: url, incognito: true });
						break;
					}
				default:
			}

		},

		blackList: function (url, callback) {

			if (openDb()) {

				window.db.transaction(function (tx) {


					tx.executeSql('UPDATE urls SET blacklisted = ? WHERE url = ?', [1, url]);

				}, function (t) {
					errorHandler(t, getLineInfo());

				});


			}

		},

		undoBlackList: function (url) {


			if (openDb()) {

				window.db.transaction(function (tx) {


					tx.executeSql('UPDATE urls SET blacklisted = ? WHERE url = ?', [0, url]);

				}, function (t) {
					errorHandler(t, getLineInfo());
				});


			}
		},

		clearBlackList: function () {


			if (openDb()) {

				window.db.transaction(function (tx) {


					tx.executeSql('UPDATE urls SET blacklisted = ?', [0]);

				}, function (t) {
					errorHandler(t, getLineInfo());
				});


			}
		},
		onChanged: new eventHandlerObj('conduit.newtab.mostVisited.onchanged'),
		OPEN_TYPE: OPEN_TYPE,
		developerMode: developerMode
	};

	return obj;
};               //end of mostVisited

      // Delete top sites (eg top tiles) that have fallen below the frecency threshold
      //      window.db.transaction(function (tx) {
      //         tx.executeSql('SELECT frecency FROM urls WHERE type = 1 ORDER BY frecency DESC LIMIT 50,50', [], function (tx, results) {
      //            if (results.rows.length > 0) {
      //               window.frecencyThreshold = results.rows.item(0).frecency;
      //            } else {
      //               window.frecencyThreshold = 75;
      //            }
      //            tx.executeSql('SELECT url FROM thumbs WHERE frecency < ? AND manual != 1', [window.frecencyThreshold], function (tx, results2) {
      //               var len = results2.rows.length, i;
      //               if (len > 0) {
      //                  window.thumbsToDelete = new Array();
      //                  for (var i = 0; i < len; i++) {
      //                     window.thumbsToDelete[window.thumbsToDelete.length] = results2.rows.item(i).url;
      //                  }
      //               }
      //            });
      //            tx.executeSql('DELETE FROM thumbs WHERE frecency < ? AND manual != 1', [window.frecencyThreshold]);
      //         });
      //      }, null, function () {
      //         if (window.thumbsToDelete) {
      //            var deleteThumb = function (url) {
      //               window.requestFileSystem(window.PERSISTENT, 50 * 1024 * 1024, function (fs) {
      //                  fs.root.getFile('/thumbs/' + hex_md5(url) + ".png", { create: false }, function (fileEntry) {
      //                     fileEntry.remove(function () { }, function () { });
      //                  });
      //               });
      //               if (window.thumbsToDelete && window.thumbsToDelete.length) {
      //                  deleteThumb(window.thumbsToDelete.pop());
      //               } else {
      //                  delete window.thumbsToDelete;
      //               }
      //            };
      //            deleteThumb(window.thumbsToDelete.pop());
      //         }
      //      });
