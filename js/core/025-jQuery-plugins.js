(function(window, undefined) {
	var $ = window.jQuery;

	$.fn.reverse = [].reverse;

	/* $.topZ jQuery plugin
	 * Based on http://abcoder.com/javascript/a-better-process-to-find-maximum-z-index-within-a-page
	 * Returns one plus the maximum z-index of all elements that are children of the document body.
	 * by: jsmreese
	 */
	$.topZ = function () {
		return 1 + Math.max.apply(undefined, $.map($("body > *"), function(elem, index) {
			return parseInt($(elem).css("z-index"), 10) || 1;
		}));
	};

	/* $.fn.scaleAreas jQuery plugin
	 * Scales the area coords within a target by an arbitrary factor.
	 * by: jsmreese
	 */
	$.fn.scaleAreas = function (factor) {
		this.find("area").attr("coords", function (index, coords) {
			return _.map(coords.split(","), function (coord) {
				return Math.round(coord * factor);
			}).join(",");
		});
		
		return this;
	};

	/* $.loadScript jQuery plugin
	 * Loads a script element onto the page.
	 * Does not use $.ajax() or $.getScript().
	 * Structured as a jQuery plugin because that's where DOM Manipulation tools are found.
	 * Returns a jQuery Deferred object.
	 * Accepts src, success, error, or a settings object
	 * by: jsmreese
	 */
	$.loadScript = function (src, success, error) {
		var elem,
			settings = (_.isPlainObject(src) ? src : {
				src: src,
				success: success,
				error: error
			}),
			ret = $.Deferred();

		if (!settings.src) {
			DDK.warn("$.loadScript(): no `src` argument."); 
			return;
		}
		
		elem = document.createElement("script");
		elem.onload = function (e) {
			DDK.info("Script load complete.", settings.src);
			ret.resolve();
		};
		elem.onerror = function (e) {
			DDK.error("Script load error.", settings.src);
			ret.reject();
		};

		elem.src = settings.src;
		document.body.appendChild(elem);
		
		return ret.then(settings.success).fail(settings.error);
	};

	/* $.fn.rowspan jQuery plugin
	 * Adds rowspans to an html table element
	 * for td elements at the provided column index.
	 * Returns the calling jQuery collection.
	 * by: jsmreese
	 */
	$.fn.rowspan = function (columnIndex) {
		var $rows = $(this).find("tbody").find("tr"),
			lastValue,
			$rowspanTarget,
			rowspanCount;
		
		$rows.each(function (rowIndex, row) {
			var $row = $(row),
				$target = $row.find("td").eq(columnIndex),
				currentValue = $target.html();
			
			if (typeof lastValue === "undefined") {
				// setup row span target
				lastValue = currentValue;
				$rowspanTarget = $target;
				rowspanCount = 1;
				
			} else if (currentValue === lastValue) {
				$target.remove();
				rowspanCount += 1;
				
			} else {
				// finalize row span target
				$rowspanTarget.attr("rowspan", rowspanCount);
				
				// start a new row span target
				lastValue = currentValue;
				$rowspanTarget = $target;
				rowspanCount = 1;
			}
		});

		// finalize the last row span target
		if (rowspanCount) {
			$rowspanTarget.attr("rowspan", rowspanCount);
		}
		
		return this;
	}
	
	/* $.fn.isControl jQuery plugin
	 * Returns true if an element is a DDK Control container.
	 * If there are multiple elements in the collection, 
	 * it will return true if any of the elements is a control container.
	 * by: jsmreese
	 */
	$.fn.isControl = function () {
		return _.any(this.map(function (index, elem) {
			var data = $(elem).controlData();
			if (data && data.name && data.id) {
				return true;
			}
		}).get());
	};
	
	/* $.fn.reloadControls jQuery plugin
	 * Reloads DDK Control elements.
	 * by: jsmreese
	 */
	$.fn.reloadControls = $.fn.reload = function () {
		return this.each(function (index, elem) {
			var data = $(elem).controlData();
			if (data && data.name && data.id) {
				DDK.reloadControl(data.name, data.id);
			}
		});
	};
	
	/* $.fn.reloadControlsQueue jQuery plugin
	 * Reloads DDK Control elements.
	 * by: jsmreese
	 */
	$.fn.reloadControlsQueue = function () {
		return this.each(function (index, elem) {
			var data = $(elem).controlData();
			if (data && data.name && data.id) {
				DDK.loadControls({ name: data.name, id: data.id });
			}
		});
	};

	/* $.fn.resizeControls jQuery plugin
	 * Resizes DDK Control elements.
	 * by: jsmreese
	 */
	$.fn.resizeControls = function () {
		return this.each(function (index, elem) {
			var data = $(elem).controlData();
			if (data && data.name && data.id) {
				DDK[data.name].resize(data.id);
			}
		});
	};

	/* $.fn.initControls jQuery plugin
	 * Initializes DDK Control elements.
	 * by: jsmreese
	 */
	$.fn.initControls = function () {
		return this.each(function (index, elem) {
			var data = $(elem).controlData();
			if (data && data.name && data.id) {
				DDK[data.name].init(data.id);
			}
		});
	};
	
	/* $.fn.findControls jQuery plugin
	 * Returns a jQuery object containing the unique set of DDK control elements that are descendants of a given element.
	 * by: jsmreese
	 */
	$.fn.findControls = function () {
		return this.pushStack($.map(this, function (elem) {
			return $(elem).find("[id^=\"psc_\"][id$=\"_widget\"]").get();
		}));
	};
	
	/* $.fn.parentControl jQuery plugin
	 * Returns a jQuery object containing the unique set of parent DDK control elements for all elements in the calling context.
	 * by: jsmreese
	 */
	$.fn.parentControl = function () {
		return this.pushStack($.unique($.map(this, function (elem) {
			return $(elem).closest("[id^=\"psc_\"][id$=\"_widget\"]").get();
		})));
	};
	
	/* $.fn.controlData jQuery plugin
	 * Returns an object or array containing the DDK control data for a control or set of DDK control elements.
	 * Will return `null` for all non-control elements, and an object for all control elements.
	 * If called on a single element, will return `null` or an object.
	 * If called on a set of elements, will return an array of `null` and/or objects.
	 * by: jsmreese
	 */
	$.fn.controlData = function () {
		var ret = _.compact($.map(this, function (elem) {
			var $elem = $(elem),
				elemIdParts = (elem.id ? elem.id.split("_") : []),
				id = elemIdParts[2],
				name = elemIdParts[1],
				controlData,
				prefixes;
			
			// return `null` for all non-DDK-control elements
			if (elemIdParts[0] !== "psc" || elemIdParts[3] !== "widget" || !id || !name ) { return null; }
			
			controlData = $.extend(true,
				{ id: id, name: name, $control: $elem },
				$elem.find("#psc_" + name + "_data_" + id).data(),
				$elem.find("[data-ddk-metrics]").data()
			);
			
			prefixes = _.sortBy(_.uniq(_.pluck(controlData.ddkMetrics, "columnMetric")));
			
			return $.extend(true, controlData, {
				fields: _.sortBy(_.map(_.pluck(controlData.ddkMetrics, "columnName"), function (name) {
					return {
						id: name.toUpperCase(),
						text: _.string.titleize(name.replace(/^org/i, "organization").replace(/^loc/i, "location"))
					};
				}), "text"),
				defaultPrefix: (_.indexOf(prefixes, "METRIC") > -1 ? "METRIC" : prefixes[0]),
				prefixes: _.map(prefixes, function (prefix) {
					var hasSequence = false,
						hasTrend = false,
						hasValue = false,
						hasNumericValues = false,
						defaultSuffix = "",
						lastSequence = "",
						firstSequence = "",
						firstSuffix = "",
						valueSuffixes = [],
						suffixes = _.map(_.sortBy(_.filter(controlData.ddkMetrics, { columnMetric: prefix }), "columnMetricAttr"), function (column) {
							var suffix = column.columnMetricAttr,
								type = column.columnType,
								isSequence = suffix.match(/[0-9]$/),
								isValue = (suffix === "VALUE"),
								isTrend = (suffix === "TREND"),
								isNumeric = column.columnIsNumeric;
							
							// columns associated with sequenced metric values ALWAYS end in a number (0-9)
							hasSequence = hasSequence || isSequence;
							hasTrend = hasTrend || isTrend;
							hasValue = hasValue || isValue;
							hasNumericValues = hasNumericValues || ((isSequence || isValue) && isNumeric);
							lastSequence = (isSequence ? suffix : lastSequence);
							firstSequence = ((firstSequence || !isSequence) ? firstSequence : suffix);
							firstSuffix = firstSuffix || suffix;
							
							if (isValue || isSequence) {
								valueSuffixes.push({ id: suffix, text: _.string.titleize(suffix), type: type });
							}
								
							return { id: "%{" + suffix + "}%", text: _.string.titleize(suffix), type: type, isAggregate: false };
						}),
						trendSuffix = _.find(suffixes, { text: "Trend" });
					
					// set Trend column to type: "trend"
					if (trendSuffix) {
						trendSuffix.type = "trend";
					}
					
					if (hasNumericValues) {
						_.each(valueSuffixes, function (suffix) {
							_.each(["MAX", "MIN", "AVG", "SUM", "COUNT"], function (aggregate) {
								suffixes.push({ id: "%{" + suffix.id + " " + aggregate + "}%", text: suffix.text + " - " + aggregate.toLowerCase(), type: suffix.type, isAggregate: true });
							});
						});
						
						if (hasSequence) {
							// trend suffix
							if (!hasTrend) {
								suffixes.push({ id: "%{TREND}%", text: "Trend", type: "trend", isAggregate: false });
							}
							
							// rtrend suffix
							suffixes.push({ id: "%{RTREND}%", text: "Reverse Trend", type: "trend", isAggregate: false });
							
							// prev value / currnet value comparison suffixes
							if (hasValue) {
								_.each(valueSuffixes, function (suffix) {
									if (suffix.id !== "VALUE") {
										suffixes.push({ id: "%{" + suffix.id + "}%,%{VALUE}%", text: suffix.text + ", Value", type: "percent", isAggregate: false });
									}
								});							
							}
						}
					}

					if (hasValue) {
						defaultSuffix = "%{VALUE}%";
					} else if (lastSequence) {
						defaultSuffix = "%{" + lastSequence + "}%";
					} else {
						defaultSuffix = "%{" + firstSuffix + "}%";
					}
					
					suffixes = _.sortBy(suffixes, ["isAggregate", "text"]);
				
					return {
						id: prefix,
						text: _.string.titleize(prefix.replace(/^org/i, "organization").replace(/^loc/i, "location")),
						suffixes: suffixes,
						defaultSuffix: defaultSuffix
					};
				})
			});
		}));
		
		if (!ret.length) { return null; };
		if (ret.length === 1) { return ret[0]; }
		return ret;
	};
	
	/* $.fn.dataStack jQuery plugin
	 * Returns an object containing the merged data objects from an element and all its parents. Data defined on the element itself will have highest priority.
	 * by: jsmreese
	 */
	$.fn.dataStack = function () {
		return $.extend.apply(null, [{}].concat(this.parents().addBack().map(function (index, elem) {
			// this check is here to prevent execptions in IE11
			// when calling $.fn.data() on the body element when it has an onpageshow attribute
			// more info:
			// http://bugs.jquery.com/ticket/14894
			// http://jira.pureshare.com/jira/browse/PSDDK-657
			if (elem.tagName === "BODY" && _.indexOf(elem.attributes, null) > -1) {
				return {};
			}
			
			return $(elem).data();
		}).get()));
	};
	

	/* $.fn.editor jQuery plugin
	 * Creates a CodeMirror editor from a textarea.
	 * Automatically detects JSON or text content.
	 * Accepts OptionGroup Models for line-based automatic help in JSON mode.
	 * by: jsmreese
	 */
	 $.fn.editor = function (settings) {
		var elem = this.get(0),
			editor,
			waiting,
			messages = [],
			settings = _.merge({}, $.fn.editor.defaults, settings || {}, {
				value: _.string.parseJSON(elem.value)
			}),
			messageTemplate = _.template(settings.messageTemplate),
			optionHelpTemplate = _.template(settings.optionHelpTemplate),
			JSHINT = window.JSHINT || null,
			updateHints,
			updateHelp,
			updateMarkers;
			
		// allow setting language via data-language
		settings.language = $.data(elem, "language") || _.result(settings, "language");

		// handle language
		switch (settings.language) {
			case "json":
				// set CodeMirror to use json mode
				settings.editorSettings.mode = {
					name: "javascript",
					json: true
				};
				
				// initialize OptionGroup-based gutter help
				if (settings.optionGroupModel) {
					settings.editorSettings.gutters = ["CodeMirror-options-help"];
				}
				
				updateHints = function () {
					editor.operation(function () {
						var errors;
						
						// clear messages
						_.each(messages, editor.removeLineWidget);
						messages.length = 0;
	
						// lint value
						JSHINT(editor.getValue());
						
						// create messages for errors
						_.each(JSHINT.errors, function (err, index) {
							if (settings.messageCount && index === settings.messageCount) {
								return false;
							}
							messages.push(editor.addLineWidget(err.line - 1, $(messageTemplate(_.extend({}, _.string, err))).get(0), settings.messageSettings));
						});
						
						$(editor.getTextArea()).closest(".ui-dialog-content")[JSHINT.errors.length ? "addClass" : "removeClass"]("config-error");
					});
				};
				
				updateHelp = function () {
					editor.operation(function () {
						var props,
							optionGroups = [].concat(settings.optionGroupModel),
							options = _.flatten(_.map(optionGroups, function (optionGroup) {
								return optionGroup.reduce(function (optionModel, accumulator) {
									accumulator.push({ id: optionModel.get("id"), label: optionModel.get("label"), description: optionModel.get("description"), notes: optionModel.get("notes") });
								}, { includeEmpty: true });
							}));
						
						// clear options help markers
						editor.clearGutter("CodeMirror-options-help");
	
						// search editor for known properties
						props = _.each(_.range(0, editor.doc.lineCount()), function (lineNumber) {
							var lineInfo = editor.lineInfo(lineNumber),
								match = lineInfo.text.match(/^[ \t]*"[a-zA-Z]+":/),
								prop = match && match[0] && _.string.underscored(match[0].replace(/[^a-zA-Z]/g, "")),
								option = _.find(options, { id: prop}),
								helpMarker;
							
							// if no option match is found, do nothing
							if (!option) {
								return;
							}
							
							// if a known property is found, create a help marker for it
							helpMarker = $(optionHelpTemplate(_.extend({}, _.string, lineInfo, option))).get(0);
							editor.setGutterMarker(lineInfo.line, "CodeMirror-options-help", helpMarker);
	
						});
					});
				};
				
				updateMarkers = function () {
					JSHINT && updateHints();
					settings.optionGroupModel && updateHelp();
				};

				break;
			
			case "text":
				settings.editorSettings.lineWrapping = true;
				
				break;
			
			default:
			
		}
		
		// setup CodeMirror instance
		editor = CodeMirror.fromTextArea(elem, settings.editorSettings);

		// setup save on blur
		editor.on("blur", function (){
			editor.save();
		});

		// setup editor hinting and help
		if (updateMarkers) {
			editor.on("change", function () {
				clearTimeout(waiting);
				waiting = setTimeout(updateMarkers, 500);
			});
	
			setTimeout(updateMarkers, 100);
		}
		
		// save reference to CodeMirror instance in element data
		$.data(elem, "editor", editor);
	
		return this;
	};
	
	$.fn.editor.defaults = {
		// language defaults to "json" if value can be parsed as JSON
		// otherwise, language defaults to "text"
		language: function () {
			return (_.isPlainObject(this.value) ? "json" : "text");
		},
		messageCount: 1,
		messageTemplate: "<div class=\"lint-error\"><%= reason %></div>",
		messageSettings: {
			coverGutter: false,
			noHScroll: true
		},
		editorSettings: {
			indentUnit: 4,
			indentWithTabs: true,
			lineNumbers: true
		},
		optionGroupModel: null,
		optionHelpTemplate: "<span class=\"editor-option-help\" title=\"<%= camelize(id) %> (line <%= 1 + line %>)\n\n<%= label %>\n\n<%= description %>\n<%= notes %>\">?</span>"
	};
	
})(this);

/*! http://mths.be/placeholder v2.0.7 by @mathias */
;(function(f,h,$){var a='placeholder' in h.createElement('input'),d='placeholder' in h.createElement('textarea'),i=$.fn,c=$.valHooks,k,j;if(a&&d){j=i.placeholder=function(){return this};j.input=j.textarea=true}else{j=i.placeholder=function(){var l=this;l.filter((a?'textarea':':input')+'[placeholder]').not('.placeholder').bind({'focus.placeholder':b,'blur.placeholder':e}).data('placeholder-enabled',true).trigger('blur.placeholder');return l};j.input=a;j.textarea=d;k={get:function(m){var l=$(m);return l.data('placeholder-enabled')&&l.hasClass('placeholder')?'':m.value},set:function(m,n){var l=$(m);if(!l.data('placeholder-enabled')){return m.value=n}if(n==''){m.value=n;if(m!=h.activeElement){e.call(m)}}else{if(l.hasClass('placeholder')){b.call(m,true,n)||(m.value=n)}else{m.value=n}}return l}};a||(c.input=k);d||(c.textarea=k);$(function(){$(h).delegate('form','submit.placeholder',function(){var l=$('.placeholder',this).each(b);setTimeout(function(){l.each(e)},10)})});$(f).bind('beforeunload.placeholder',function(){$('.placeholder').each(function(){this.value=''})})}function g(m){var l={},n=/^jQuery\d+$/;$.each(m.attributes,function(p,o){if(o.specified&&!n.test(o.name)){l[o.name]=o.value}});return l}function b(m,n){var l=this,o=$(l);if(l.value==o.attr('placeholder')&&o.hasClass('placeholder')){if(o.data('placeholder-password')){o=o.hide().next().show().attr('id',o.removeAttr('id').data('placeholder-id'));if(m===true){return o[0].value=n}o.focus()}else{l.value='';o.removeClass('placeholder');l==h.activeElement&&l.select()}}}function e(){var q,l=this,p=$(l),m=p,o=this.id;if(l.value==''){if(l.type=='password'){if(!p.data('placeholder-textinput')){try{q=p.clone().attr({type:'text'})}catch(n){q=$('<input>').attr($.extend(g(this),{type:'text'}))}q.removeAttr('name').data({'placeholder-password':true,'placeholder-id':o}).bind('focus.placeholder',b);p.data({'placeholder-textinput':q,'placeholder-id':o}).before(q)}p=p.removeAttr('id').hide().prev().attr('id',o).show()}p.addClass('placeholder');p[0].value=p.attr('placeholder')}else{p.removeClass('placeholder')}}}(this,document,jQuery));

;
/*
 * jQuery BBQ: Back Button & Query Library - v1.2.1 - 2/17/2010
 * http://benalman.com/projects/jquery-bbq-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function($,p){var i,m=Array.prototype.slice,r=decodeURIComponent,a=$.param,c,l,v,b=$.bbq=$.bbq||{},q,u,j,e=$.event.special,d="hashchange",A="querystring",D="fragment",y="elemUrlAttr",g="location",k="href",t="src",x=/^.*\?|#.*$/g,w=/^.*\#/,h,C={};function E(F){return typeof F==="string"}function B(G){var F=m.call(arguments,1);return function(){return G.apply(this,F.concat(m.call(arguments)))}}function n(F){return F.replace(/^[^#]*#?(.*)$/,"$1")}function o(F){return F.replace(/(?:^[^?#]*\?([^#]*).*$)?.*/,"$1")}function f(H,M,F,I,G){var O,L,K,N,J;if(I!==i){K=F.match(H?/^([^#]*)\#?(.*)$/:/^([^#?]*)\??([^#]*)(#?.*)/);J=K[3]||"";if(G===2&&E(I)){L=I.replace(H?w:x,"")}else{N=l(K[2]);I=E(I)?l[H?D:A](I):I;L=G===2?I:G===1?$.extend({},I,N):$.extend({},N,I);L=a(L);if(H){L=L.replace(h,r)}}O=K[1]+(H?"#":L||!K[1]?"?":"")+L+J}else{O=M(F!==i?F:p[g][k])}return O}a[A]=B(f,0,o);a[D]=c=B(f,1,n);c.noEscape=function(G){G=G||"";var F=$.map(G.split(""),encodeURIComponent);h=new RegExp(F.join("|"),"g")};c.noEscape(",/");$.deparam=l=function(I,F){var H={},G={"true":!0,"false":!1,"null":null};$.each(I.replace(/\+/g," ").split("&"),function(L,Q){var K=Q.split("="),P=r(K[0]),J,O=H,M=0,R=P.split("]["),N=R.length-1;if(/\[/.test(R[0])&&/\]$/.test(R[N])){R[N]=R[N].replace(/\]$/,"");R=R.shift().split("[").concat(R);N=R.length-1}else{N=0}if(K.length===2){J=r(K[1]);if(F){J=J&&!isNaN(J)?+J:J==="undefined"?i:G[J]!==i?G[J]:J}if(N){for(;M<=N;M++){P=R[M]===""?O.length:R[M];O=O[P]=M<N?O[P]||(R[M+1]&&isNaN(R[M+1])?{}:[]):J}}else{if($.isArray(H[P])){H[P].push(J)}else{if(H[P]!==i){H[P]=[H[P],J]}else{H[P]=J}}}}else{if(P){H[P]=F?i:""}}});return H};function z(H,F,G){if(F===i||typeof F==="boolean"){G=F;F=a[H?D:A]()}else{F=E(F)?F.replace(H?w:x,""):F}return l(F,G)}l[A]=B(z,0);l[D]=v=B(z,1);$[y]||($[y]=function(F){return $.extend(C,F)})({a:k,base:k,iframe:t,img:t,input:t,form:"action",link:k,script:t});j=$[y];function s(I,G,H,F){if(!E(H)&&typeof H!=="object"){F=H;H=G;G=i}return this.each(function(){var L=$(this),J=G||j()[(this.nodeName||"").toLowerCase()]||"",K=J&&L.attr(J)||"";L.attr(J,a[I](K,H,F))})}$.fn[A]=B(s,A);$.fn[D]=B(s,D);b.pushState=q=function(I,F){if(E(I)&&/^#/.test(I)&&F===i){F=2}var H=I!==i,G=c(p[g][k],H?I:{},H?F:2);p[g][k]=G+(/#/.test(G)?"":"#")};b.getState=u=function(F,G){return F===i||typeof F==="boolean"?v(F):v(G)[F]};b.removeState=function(F){var G={};if(F!==i){G=u();$.each($.isArray(F)?F:arguments,function(I,H){delete G[H]})}q(G,2)};e[d]=$.extend(e[d],{add:function(F){var H;function G(J){var I=J[D]=c();J.getState=function(K,L){return K===i||typeof K==="boolean"?l(I,K):l(I,L)[K]};H.apply(this,arguments)}if($.isFunction(F)){H=F;return G}else{H=F.handler;F.handler=G}}})})(jQuery,this);
/*
 * jQuery hashchange event - v1.2 - 2/11/2010
 * http://benalman.com/projects/jquery-hashchange-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function($,i,b){var j,k=$.event.special,c="location",d="hashchange",l="href",f=$.browser,g=document.documentMode,h=f.msie&&(g===b||g<8),e="on"+d in i&&!h;function a(m){m=m||i[c][l];return m.replace(/^[^#]*#?(.*)$/,"$1")}$[d+"Delay"]=100;k[d]=$.extend(k[d],{setup:function(){if(e){return false}$(j.start)},teardown:function(){if(e){return false}$(j.stop)}});j=(function(){var m={},r,n,o,q;function p(){o=q=function(s){return s};if(h){n=$('<iframe src="javascript:0"/>').hide().insertAfter("body")[0].contentWindow;q=function(){return a(n.document[c][l])};o=function(u,s){if(u!==s){var t=n.document;t.open().close();t[c].hash="#"+u}};o(a())}}m.start=function(){if(r){return}var t=a();o||p();(function s(){var v=a(),u=q(t);if(v!==t){o(t=v,u);$(i).trigger(d)}else{if(u!==t){i[c][l]=i[c][l].replace(/#.*/,"")+"#"+u}}r=setTimeout(s,$[d+"Delay"])})()};m.stop=function(){if(!n){r&&clearTimeout(r);r=0}};return m})()})(jQuery,this);
;