PS.Formatter = function (el) {
	function exec() {
		var formatter = this.format && this[this.format],
			formattedValue;
			
		if (typeof formatter === "function") {
			formattedValue = formatter.call(this);
		}
			
		if (formattedValue != null) {
			this.$el.html(formattedValue);
		}
		
		this.$el.removeAttr("data-format");
	}
	
	var $el = $(el);

	// there can be only one element
	if ($el.length > 1) { throw "PS.Formatter matched more than one element." }
	if (!$el.length) { throw "PS.Formatter did not match any elements." }

	// extend the formatter object
	// with all of the data attributes from 
	// this element and all parent elements
	_.extend(this, _.pick($el.dataStack(), function (value, key) {
		return _.string.startsWith(key, "format");
	}));
	
	// setup element references
	this.$el = $el;
	this.el = $el.get(0);
	
	// create exec function reference
	this.exec = exec;
};

// create a jQuery-esque reference to the PS.Formatter prototype
PS.Formatter.fn = PS.Formatter.prototype;

// formats array to be used as a datasource for UI (structured for Select2)
PS.Formatter.formats = [];

// database datatype to format type map
PS.Formatter.typeMap = {};

// register method for adding formats to the formats array
PS.Formatter.register = function(settings) {
	// verify that the format function exists
	if (typeof PS.Formatter.fn[settings.id] !== "function") {
		DDK.error("Unable to register formatter. `PS.Formatter.fn." + settings.id + "` is not a function.");
		return;
	}
	
	// add format to the formats array
	PS.Formatter.formats.push({
		id: settings.id,
		text: settings.text,
		sortOrder: settings.sortOrder,
		name: settings.name,
		styles: []
	});
	
	// sort formats array
	PS.Formatter.formats.sort(function (a, b) {
		return a.sortOrder - b.sortOrder;
	});
	
	// add defaults to the formatter function
	PS.Formatter.fn[settings.id].defaults = settings.defaults || {};
	
	// extend type map
	if (settings.datatype) {
		_.each(settings.datatype.split(" "), function (datatype) {
			PS.Formatter.typeMap[datatype] = settings.id;
		});
	}
	
	// set default format
	if (!PS.Formatter.defaultFormat || settings.isDefaultFormat) {
		PS.Formatter.defaultFormat = settings.id;
	}
};

// register method for adding styles to the format styles array
PS.Formatter.registerStyle = function(settings) {
	var format = _.find(PS.Formatter.formats, { name: settings.parentName }),
		styles = format.styles;
	
	// verify that the format function is registered
	if (!format) {
		DDK.error("Unable to register format style. `Cannot find '" + settings.parentName + "' in PS.Formatter.formats.");
		return;
	}
	
	// add style to the styles array
	styles.push(settings);
	
	// sort styles array
	styles.sort(function (a, b) {
		return a.sortOrder - b.sortOrder;
	});
	
	// add style defaults to the formatter function
	PS.Formatter.fn[format.id][settings.id] = settings.defaults || {};		
};

PS.Formatter.expandColors = function (color, steps) {
	var settings = PS.Formatter.expandColors[color],
		increment,
		l;
		
	if (steps === 1) {
		// for a single step, output the midpoint
		return [hsl2rgb(settings.h, settings.s, (settings.l.min + settings.l.max) * 0.5)];
	}
	
	if (steps === 2) {
		// for two steps, output a truncated range
		return [
			hsl2rgb(settings.h, settings.s, (settings.l.min + settings.l.max) * 0.33333),
			hsl2rgb(settings.h, settings.s, (settings.l.min + settings.l.max) * 0.66667)
		];
	}
	
		increment = (settings.l.max - settings.l.min)
		l = _.map(_.range(steps), function (value) {
			return 
		});
});

PS.Formatter.expandColors.red = { h: 0, s: 1, l: { min: 0.35, max: 0.9 } };
PS.Formatter.expandColors.yellow = { h: 36, s: 1, l: { min: 0.5, max: 0.9 } };
PS.Formatter.expandColors.green = { h: 100, s: 1, l: { min: 0.35, max: 0.9 } };
PS.Formatter.expandColors.blue = { h: 212, s: 1, l: { min: 0.35, max: 0.9 } };
PS.Formatter.expandColors.gray = { h: 0, s: 0, l: { min: 0.35, max: 0.9 } };
PS.Formatter.expandColors.neutral = PS.Formatter.expandColors.gray;

PS.Formatter.fn.getSettings = function () {
	return _.extend(
		// start with an empty object
		{},
		
		// add the global default format settings
		this.defaults,
		
		// add the default format settings for this format
		this[this.format].defaults,
		
		// add the default format settings from this format style
		this[this.format][this.formatStyle],
		
		// override with any data-format attributes from the data stack
		// remove the 'format' prefix and camelize the remaining name
		_.reduce(_.pick(this, function (value, key) {
			return key !== "format" && _.string.startsWith(key, "format");
		}), function (accumulator, value, key) {
			accumulator[_.string.camelize(key.slice(6))] = value;
			return accumulator;
		}, {})
	);
};

PS.Formatter.fn.defaults = {
	precision: 0,
	nullToZero: true,
	zero: "-",
	"null": "-",
	units: "",
	unitsPosition: "right",
	unitsAttr: "",
	unitsClassName: "",
	unitsTemplate: "<span class=\"format-units <%= unitsClassName %>\" <%= unitsAttr %>><%= units %></span>",
	arrowAttr: "",
	arrowClassName: "",
	arrowTemplate: "<span class=\"format-arrow <%= direction %> <%= arrowClassName %>\" <%= arrowAttr %>></span>",
	bulbAttr: "",
	bulbClassName: "",
	bulbTemplate: "<span class=\"format-bulb <%= bulbClassName %>\" <%= bulbAttr %>></span>",
	orientation: 1,
	direction: 0,
	method: "format"
};

// default formatter functions
PS.Formatter.fn.text = function () {
	return _.escape(this.formatValue);
};

PS.Formatter.fn.html = function () {
	return this.formatValue;
};

PS.Formatter.fn.number = function () {
	var num = +this.formatValue,
		isNum = !(num == null || isNaN(num)),
		settings = this.getSettings();

	// null replacement value
	// if nullToZero is false and formatValue is emptyString
	// (null values in the data appear here as empty strings)
	// or if the formatValue does not coerce to a number
	if (!isNum || (!settings.nullToZero && this.formatValue === "")) {
		if (!_.isNumber(settings["null"])) {
			// if settings["null"] is not a number, return the text directly without further formatting
			return settings["null"];
		}
		
		// if settings["null"] is a number, format it with units and proper number formatting
		num = settings["null"];
	} else if (num === 0) {
		if (!_.isNumber(settings.zero)) {
			// if settings.zero is not a number, return the text directly without further formatting
			return settings.zero;
		}
		
		// if settings.zero is a number, format it with units and proper number formatting
		num = settings.zero;
	}
	
	if (settings.units) {
		settings.units = _.template(settings.unitsTemplate, settings);
	}
		
	return (settings.unitsPosition === "left" ? " " + settings.units : "") +
		numeral(num).format("0,0" + (settings.precision ? "." + _.string.repeat("0", settings.precision) : "")) +
		(settings.unitsPosition === "right" ? " " + settings.units : "");
};

PS.Formatter.fn.currency = function () {
	var num = +this.formatValue,
		isNum = !(num == null || isNaN(num)),
		settings = this.getSettings();
		
	// null replacement value
	// if nullToZero is false and formatValue is emptyString
	// (null values in the data appear here as empty strings)
	// or if the formatValue does not coerce to a number
	if (!isNum || (!settings.nullToZero && this.formatValue === "")) {
		if (!_.isNumber(settings["null"])) {
			// if settings["null"] is not a number, return the text directly without further formatting
			return settings["null"];
		}
		
		// if settings["null"] is a number, format it with units and proper number formatting
		num = settings["null"];
	} else if (num === 0) {
		if (!_.isNumber(settings.zero)) {
			// if settings.zero is not a number, return the text directly without further formatting
			return settings.zero;
		}
		
		// if settings.zero is a number, format it with units and proper number formatting
		num = settings.zero;
	}
	
	if (settings.units) {
		if (settings.units === "dollars") { settings.units = "$"; }
		settings.units = _.template(settings.unitsTemplate, settings);
	}
	
	return (settings.unitsPosition === "left" ? " " + settings.units : "") +
		numeral(num).format("0,0" + (settings.precision ? "." + _.string.repeat("0", settings.precision) : "")) +
		(settings.unitsPosition === "right" ? " " + settings.units : "");
};

PS.Formatter.fn.date = function () {
	var settings = this.getSettings(),
		args = [this.formatValue],
		mom;
	
	if (settings.units) {
		args.push(settings.units);
	}
		
	mom = moment.utc.apply(null, args);
	mom.local();

	// pass settings.template argument to fromNow
	if (settings.method === "format") {
		return mom.format(settings.template);
	}
	
	if (typeof mom[settings.method] === "function") {
		return mom[settings.method]();
	}
	
	return "Invalid format method: " + settings.method;
};

PS.Formatter.fn.time = function () {
	var settings = this.getSettings(),
		args = [this.formatValue, settings.units || "seconds"],
		dur;
	
	dur = moment.duration.apply(null, args);
	
	// don't pass settings argument to humanize
	if (settings.method === "humanize") {
		return dur.humanize();
	}

	if (typeof dur[settings.method] === "function") {
		return dur[settings.method](settings);
	}
	
	return "Invalid format method: " + settings.method;
};

PS.Formatter.fn.chart = function () {
	var settings = this.getSettings();
	
	(function ($el, settings) {
		_.defer(function () {
			if ($el.parents("table").length) {
				// use 80px as the default width for charts in a table
				// use the element font size as the default height for charts in a table
				settings.width = settings.width || 80;
				settings.height = settings.height || parseInt($el.css("line-height"), 10) || parseInt($el.css("font-size"), 10) || 24;
				
			} else {
				// use the element width as the default width for charts
				// in other elements if possible
				// use 3/4 of the element font size as the default height for charts outside of tables
				settings.width = settings.width || $el.width() || 80;
				settings.height = settings.height || (parseInt($el.css("font-size"), 10) * 0.75).toFixed();
			}

			$el.sparkline(settings.value.toString().split(","), settings);
		});
	})(this.$el, settings);
};

PS.Formatter.fn.bar = function () {
	var settings = this.getSettings(),
		elemIndex,
		$parents = this.$el.parents(),
		$table = $parents.filter("table"),
		$cell = $parents.filter("th, td"),
		$cells,
		hasTable = !!$table.length;
	
	// calculate and cache max value if it is not provided or already calculated
	if (!settings.max) {
		if (hasTable) {
			elemIndex = $cell.index();
			$cells = $table.find("tbody").find("tr").find("th:eq(" + elemIndex + "), td:eq(" + elemIndex + ")");
			
			settings.max = Math.max.apply(null, $cells.map(function (index, elem) {
				return $(elem).find("[data-format=\"bar\"]").data("formatValue");
			}).get());
			
			$cells.data("formatMax", settings.max);
		} else {
			DDK.error("Must set data-format-max when using bar format function outside a table or scorecard.");
		}
	}
	
	(function ($el, settings) {
		_.defer(function () {
			if (hasTable) {
				// use 80px as the default width for charts in a table
				// use the element font size as the default height for charts in a table
				settings.width = settings.width || 80;
				settings.height = settings.height || parseInt($el.css("line-height"), 10) || parseInt($el.css("font-size"), 10) || 24;
				
			} else {
				// use the element width as the default width for charts
				// in other elements if possible
				// use 3/4 of the element font size as the default height for charts outside of tables
				settings.width = settings.width || $el.width() || 80;
				settings.height = settings.height || (parseInt($el.css("font-size"), 10) * 0.75).toFixed();
			}
			
			settings.type = "bullet";

			$el.sparkline([settings.target || "", settings.performance || "", settings.max, settings.value], settings);
		});
	})(this.$el, settings);
};

PS.Formatter.fn.stackedbar = function () {
	function sum() {
		var args = [].slice.call(arguments);
		return _.reduce(args, function (accumulator, value) {
			return accumulator + (+value);
		}, 0);
	}

	var settings = this.getSettings(),
		elemIndex,
		$parents = this.$el.parents(),
		$table = $parents.filter("table"),
		$cell = $parents.filter("th, td"),
		$cells,
		hasTable = !!$table.length;
	
	// calculate and cache max value if it is not provided or already calculated
	if (!settings.max) {
		if (hasTable) {
			elemIndex = $cell.index();
			$cells = $table.find("tbody").find("tr").find("th:eq(" + elemIndex + "), td:eq(" + elemIndex + ")");
			
			settings.max = Math.max.apply(null, $cells.map(function (index, elem) {
				var formatValue = $(elem).find("[data-format=\"stackedbar\"]").data("formatValue");
				return sum.apply(null, formatValue ? formatValue.split(",") : []);
			}).get());
			
			$cells.data("formatMax", settings.max);
		} else {
			DDK.error("Must set data-format-max when using bar format function outside a table or scorecard.");
		}
	}
	
	(function ($el, settings) {
		_.defer(function () {

			var values = _.map(settings.value.toString().split(","), function (value, index, collection) {
				return sum.apply(null, collection.slice(0, index + 1));
			});
			
			if ($el.parents("table").length) {
				// use 80px as the default width for charts in a table
				// use the element font size as the default height for charts in a table
				settings.width = settings.width || 80;
				settings.height = settings.height || parseInt($el.css("line-height"), 10) || parseInt($el.css("font-size"), 10) || 24;
				
			} else {
				// use the element width as the default width for charts
				// in other elements if possible
				// use 3/4 of the element font size as the default height for charts outside of tables
				settings.width = settings.width || $el.width() || 80;
				settings.height = settings.height || (parseInt($el.css("font-size"), 10) * 0.75).toFixed();
			}
			
			settings.type = "bullet";

			$el.sparkline([settings.target || "", settings.performance || "", settings.max].concat(values.reverse()), settings);
		});
	})(this.$el, settings);
};

PS.Formatter.fn.stackedbar100 = function () {
	var settings = this.getSettings();
	
	(function ($el, settings) {
		_.defer(function () {
			function sum() {
				var args = [].slice.call(arguments);
				return _.reduce(args, function (accumulator, value) {
					return accumulator + (+value);
				}, 0);
			}
			
			var values = _.map(settings.value.toString().split(","), function (value, index, collection) {
				return sum.apply(null, collection.slice(0, index + 1));
			});
			
			if ($el.parents("table").length) {
				// use 80px as the default width for charts in a table
				// use the element font size as the default height for charts in a table
				settings.width = settings.width || 80;
				settings.height = settings.height || parseInt($el.css("line-height"), 10) || parseInt($el.css("font-size"), 10) || 24;
				
			} else {
				// use the element width as the default width for charts
				// in other elements if possible
				// use 3/4 of the element font size as the default height for charts outside of tables
				settings.width = settings.width || $el.width() || 80;
				settings.height = settings.height || (parseInt($el.css("font-size"), 10) * 0.75).toFixed();
			}
			
			settings.type = "bullet";

			$el.sparkline([settings.target || "", settings.performance || ""].concat(values.reverse()), settings);
		});
	})(this.$el, settings);
};

PS.Formatter.fn.arrow = function () {
	var value = ((this.formatValue && this.formatValue.indexOf(",") > -1) ? 
			PS.Formatter.calcs.change(this.formatValue) : 
			this.formatValue
		),
		num = +value,
		settings = this.getSettings();
	
	if (!settings.direction) {	
		if (num > 0 && settings.orientation === 1 || num < 0 && settings.orientation === -1) {
			settings.direction = "up";
		} else if (num > 0 && settings.orientation === -1 || num < 0 && settings.orientation === 1) {
			settings.direction = "down";
		} else {
			settings.direction = "neutral";		
		}
	}
	
	return _.template(settings.arrowTemplate, settings);
};

PS.Formatter.fn.bulb = function () {
	var settings = this.getSettings();
	
	return _.template(settings.bulbTemplate, settings);
};

PS.Formatter.calcs = {};

PS.Formatter.calcs.percentChange = function (input) {
	// performs calculation of (last - first) / first
	// given a comma-separated list of inputs
	var values = (input ? input.split(",") : []),
		firstValue = values[0],
		firstNum = +firstValue,
		lastValue = values[values.length - 1],
		lastNum = +lastValue;
	
	if ((firstValue == null && lastValue == null) || isNaN(firstNum) || isNaN(lastNum)) {
		// let format function null handling take over
		// if both values are null
		// or if one value is not a number
		return "";
	}
	
	if (firstNum === 0) {
		if (lastNum === 0) {
			// change from 0 to 0 is 0
			return 0;
		}
		
		// change from 0 is always 100%
		return 100;
	}

	return (lastNum - firstNum) / firstNum * 100;
};

PS.Formatter.calcs.change = function (input) {
	// performs calculation of (last - first)
	// given a comma-separated list of inputs
	var values = (input ? input.split(",") : []),
		firstValue = values[0],
		firstNum = +firstValue,
		lastValue = values[values.length - 1],
		lastNum = +lastValue;
	
	if ((firstValue == null && lastValue == null) || isNaN(firstNum) || isNaN(lastNum)) {
		// let format function null handling take over
		// if both values are null
		// or if one value is not a number
		return "";
	}

	return lastNum - firstNum;
};

PS.Formatter.fn.percent = function () {
	var value = ((this.formatValue && this.formatValue.indexOf(",") > -1) ? 
			PS.Formatter.calcs.percentChange(this.formatValue) : 
			this.formatValue
		),
		num = +value,
		isNum = !(num == null || isNaN(num)),
		settings = this.getSettings();
		
	// null replacement value
	// if nullToZero is false and formatValue is emptyString
	// (null values in the data appear here as empty strings)
	// or if the formatValue does not coerce to a number
	if (!isNum || (!settings.nullToZero && value === "")) {
		if (!_.isNumber(settings["null"])) {
			// if settings["null"] is not a number, return the text directly without further formatting
			return settings["null"];
		}
		
		// if settings["null"] is a number, format it with units and proper number formatting
		num = settings["null"];
	} else if (num === 0) {
		if (!_.isNumber(settings.zero)) {
			// if settings.zero is not a number, return the text directly without further formatting
			return settings.zero;
		}
		
		// if settings.zero is a number, format it with units and proper number formatting
		num = settings.zero;
	}
	
	settings.units = "%";
	settings.units = _.template(settings.unitsTemplate, settings);
		
	return numeral(num).format("0,0" + (settings.precision ? "." + _.string.repeat("0", settings.precision) : "")) + settings.units;
};