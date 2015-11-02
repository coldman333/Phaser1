//     Backbone.js 1.2.3

//     (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(factory) {

  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
  // We use `self` instead of `window` for `WebWorker` support.
  var root = (typeof self == 'object' && self.self == self && self) ||
            (typeof global == 'object' && global.global == global && global);

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore'), $;
    try { $ = require('jquery'); } catch(e) {}
    factory(root, exports, _, $);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create a local reference to a common array method we'll want to use later.
  var slice = Array.prototype.slice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.2.3';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... this will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Proxy Backbone class methods to Underscore functions, wrapping the model's
  // `attributes` object or collection's `models` array behind the scenes.
  //
  // collection.filter(function(model) { return model.get('age') > 10 });
  // collection.each(this.addView);
  //
  // `Function#apply` can be slow so we use the method's arg count, if we know it.
  var addMethod = function(length, method, attribute) {
    switch (length) {
      case 1: return function() {
        return _[method](this[attribute]);
      };
      case 2: return function(value) {
        return _[method](this[attribute], value);
      };
      case 3: return function(iteratee, context) {
        return _[method](this[attribute], cb(iteratee, this), context);
      };
      case 4: return function(iteratee, defaultVal, context) {
        return _[method](this[attribute], cb(iteratee, this), defaultVal, context);
      };
      default: return function() {
        var args = slice.call(arguments);
        args.unshift(this[attribute]);
        return _[method].apply(_, args);
      };
    }
  };
  var addUnderscoreMethods = function(Class, methods, attribute) {
    _.each(methods, function(length, method) {
      if (_[method]) Class.prototype[method] = addMethod(length, method, attribute);
    });
  };

  // Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
  var cb = function(iteratee, instance) {
    if (_.isFunction(iteratee)) return iteratee;
    if (_.isObject(iteratee) && !instance._isModel(iteratee)) return modelMatcher(iteratee);
    if (_.isString(iteratee)) return function(model) { return model.get(iteratee); };
    return iteratee;
  };
  var modelMatcher = function(attrs) {
    var matcher = _.matches(attrs);
    return function(model) {
      return matcher(model.attributes);
    };
  };

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // a custom event channel. You may bind a callback to an event with `on` or
  // remove with `off`; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {};

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Iterates over the standard `event, callback` (as well as the fancy multiple
  // space-separated events `"change blur", callback` and jQuery-style event
  // maps `{event: callback}`).
  var eventsApi = function(iteratee, events, name, callback, opts) {
    var i = 0, names;
    if (name && typeof name === 'object') {
      // Handle event maps.
      if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
      for (names = _.keys(name); i < names.length ; i++) {
        events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
      }
    } else if (name && eventSplitter.test(name)) {
      // Handle space separated event names by delegating them individually.
      for (names = name.split(eventSplitter); i < names.length; i++) {
        events = iteratee(events, names[i], callback, opts);
      }
    } else {
      // Finally, standard events.
      events = iteratee(events, name, callback, opts);
    }
    return events;
  };

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  Events.on = function(name, callback, context) {
    return internalOn(this, name, callback, context);
  };

  // Guard the `listening` argument from the public API.
  var internalOn = function(obj, name, callback, context, listening) {
    obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
        context: context,
        ctx: obj,
        listening: listening
    });

    if (listening) {
      var listeners = obj._listeners || (obj._listeners = {});
      listeners[listening.id] = listening;
    }

    return obj;
  };

  // Inversion-of-control versions of `on`. Tell *this* object to listen to
  // an event in another object... keeping track of what it's listening to
  // for easier unbinding later.
  Events.listenTo =  function(obj, name, callback) {
    if (!obj) return this;
    var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
    var listeningTo = this._listeningTo || (this._listeningTo = {});
    var listening = listeningTo[id];

    // This object is not listening to any other events on `obj` yet.
    // Setup the necessary references to track the listening callbacks.
    if (!listening) {
      var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
      listening = listeningTo[id] = {obj: obj, objId: id, id: thisId, listeningTo: listeningTo, count: 0};
    }

    // Bind callbacks on obj, and keep track of them on listening.
    internalOn(obj, name, callback, this, listening);
    return this;
  };

  // The reducing API that adds a callback to the `events` object.
  var onApi = function(events, name, callback, options) {
    if (callback) {
      var handlers = events[name] || (events[name] = []);
      var context = options.context, ctx = options.ctx, listening = options.listening;
      if (listening) listening.count++;

      handlers.push({ callback: callback, context: context, ctx: context || ctx, listening: listening });
    }
    return events;
  };

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  Events.off =  function(name, callback, context) {
    if (!this._events) return this;
    this._events = eventsApi(offApi, this._events, name, callback, {
        context: context,
        listeners: this._listeners
    });
    return this;
  };

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  Events.stopListening =  function(obj, name, callback) {
    var listeningTo = this._listeningTo;
    if (!listeningTo) return this;

    var ids = obj ? [obj._listenId] : _.keys(listeningTo);

    for (var i = 0; i < ids.length; i++) {
      var listening = listeningTo[ids[i]];

      // If listening doesn't exist, this object is not currently
      // listening to obj. Break out early.
      if (!listening) break;

      listening.obj.off(name, callback, this);
    }
    if (_.isEmpty(listeningTo)) this._listeningTo = void 0;

    return this;
  };

  // The reducing API that removes a callback from the `events` object.
  var offApi = function(events, name, callback, options) {
    if (!events) return;

    var i = 0, listening;
    var context = options.context, listeners = options.listeners;

    // Delete all events listeners and "drop" events.
    if (!name && !callback && !context) {
      var ids = _.keys(listeners);
      for (; i < ids.length; i++) {
        listening = listeners[ids[i]];
        delete listeners[listening.id];
        delete listening.listeningTo[listening.objId];
      }
      return;
    }

    var names = name ? [name] : _.keys(events);
    for (; i < names.length; i++) {
      name = names[i];
      var handlers = events[name];

      // Bail out if there are no events stored.
      if (!handlers) break;

      // Replace events if there are any remaining.  Otherwise, clean up.
      var remaining = [];
      for (var j = 0; j < handlers.length; j++) {
        var handler = handlers[j];
        if (
          callback && callback !== handler.callback &&
            callback !== handler.callback._callback ||
              context && context !== handler.context
        ) {
          remaining.push(handler);
        } else {
          listening = handler.listening;
          if (listening && --listening.count === 0) {
            delete listeners[listening.id];
            delete listening.listeningTo[listening.objId];
          }
        }
      }

      // Update tail event if the list has any events.  Otherwise, clean up.
      if (remaining.length) {
        events[name] = remaining;
      } else {
        delete events[name];
      }
    }
    if (_.size(events)) return events;
  };

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, its listener will be removed. If multiple events
  // are passed in using the space-separated syntax, the handler will fire
  // once for each event, not once for a combination of all events.
  Events.once =  function(name, callback, context) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
    return this.on(events, void 0, context);
  };

  // Inversion-of-control versions of `once`.
  Events.listenToOnce =  function(obj, name, callback) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
    return this.listenTo(obj, events);
  };

  // Reduces the event callbacks into a map of `{event: onceWrapper}`.
  // `offer` unbinds the `onceWrapper` after it has been called.
  var onceMap = function(map, name, callback, offer) {
    if (callback) {
      var once = map[name] = _.once(function() {
        offer(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
    }
    return map;
  };

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  Events.trigger =  function(name) {
    if (!this._events) return this;

    var length = Math.max(0, arguments.length - 1);
    var args = Array(length);
    for (var i = 0; i < length; i++) args[i] = arguments[i + 1];

    eventsApi(triggerApi, this._events, name, void 0, args);
    return this;
  };

  // Handles triggering the appropriate event callbacks.
  var triggerApi = function(objEvents, name, cb, args) {
    if (objEvents) {
      var events = objEvents[name];
      var allEvents = objEvents.all;
      if (events && allEvents) allEvents = allEvents.slice();
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, [name].concat(args));
    }
    return objEvents;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId(this.cidPrefix);
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // The prefix is used to create the client id which is used to identify models locally.
    // You may want to override this if you're experiencing name clashes with model ids.
    cidPrefix: 'c',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Special-cased proxy to underscore's `_.matches` method.
    matches: function(attrs) {
      return !!_.iteratee(attrs, this)(this.attributes);
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      var attrs;
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      var unset      = options.unset;
      var silent     = options.silent;
      var changes    = [];
      var changing   = this._changing;
      this._changing = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }

      var current = this.attributes;
      var changed = this.changed;
      var prev    = this._previousAttributes;

      // For each `set` attribute, update or delete the current value.
      for (var attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          changed[attr] = val;
        } else {
          delete changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Update the `id`.
      this.id = this.get(this.idAttribute);

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0; i < changes.length; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      var changed = {};
      for (var attr in diff) {
        var val = diff[attr];
        if (_.isEqual(old[attr], val)) continue;
        changed[attr] = val;
      }
      return _.size(changed) ? changed : false;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server, merging the response with the model's
    // local attributes. Any changed attributes will trigger a "change" event.
    fetch: function(options) {
      options = _.extend({parse: true}, options);
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        var serverAttrs = options.parse ? model.parse(resp, options) : resp;
        if (!model.set(serverAttrs, options)) return false;
        if (success) success.call(options.context, model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      // Handle both `"key", value` and `{key: value}` -style arguments.
      var attrs;
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true, parse: true}, options);
      var wait = options.wait;

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      var model = this;
      var success = options.success;
      var attributes = this.attributes;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = options.parse ? model.parse(resp, options) : resp;
        if (wait) serverAttrs = _.extend({}, attrs, serverAttrs);
        if (serverAttrs && !model.set(serverAttrs, options)) return false;
        if (success) success.call(options.context, model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      // Set temporary attributes if `{wait: true}` to properly find new ids.
      if (attrs && wait) this.attributes = _.extend({}, attributes, attrs);

      var method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch' && !options.attrs) options.attrs = attrs;
      var xhr = this.sync(method, this, options);

      // Restore attributes.
      this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;
      var wait = options.wait;

      var destroy = function() {
        model.stopListening();
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (wait) destroy();
        if (success) success.call(options.context, model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      var xhr = false;
      if (this.isNew()) {
        _.defer(options.success);
      } else {
        wrapError(this, options);
        xhr = this.sync('delete', this, options);
      }
      if (!wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      var id = this.get(this.idAttribute);
      return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.defaults({validate: true}, options));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model, mapped to the
  // number of arguments they take.
  var modelMethods = { keys: 1, values: 1, pairs: 1, invert: 1, pick: 0,
      omit: 0, chain: 1, isEmpty: 1 };

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  addUnderscoreMethods(Model, modelMethods, 'attributes');

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analogous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Splices `insert` into `array` at index `at`.
  var splice = function(array, insert, at) {
    at = Math.min(Math.max(at, 0), array.length);
    var tail = Array(array.length - at);
    var length = insert.length;
    for (var i = 0; i < tail.length; i++) tail[i] = array[i + at];
    for (i = 0; i < length; i++) array[i + at] = insert[i];
    for (i = 0; i < tail.length; i++) array[i + length + at] = tail[i];
  };

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model) { return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set. `models` may be Backbone
    // Models or raw JavaScript objects to be converted to Models, or any
    // combination of the two.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      options = _.extend({}, options);
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      var removed = this._removeModels(models, options);
      if (!options.silent && removed) this.trigger('update', this, options);
      return singular ? removed[0] : removed;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      if (models == null) return;

      options = _.defaults({}, options, setOptions);
      if (options.parse && !this._isModel(models)) models = this.parse(models, options);

      var singular = !_.isArray(models);
      models = singular ? [models] : models.slice();

      var at = options.at;
      if (at != null) at = +at;
      if (at < 0) at += this.length + 1;

      var set = [];
      var toAdd = [];
      var toRemove = [];
      var modelMap = {};

      var add = options.add;
      var merge = options.merge;
      var remove = options.remove;

      var sort = false;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      var model;
      for (var i = 0; i < models.length; i++) {
        model = models[i];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        var existing = this.get(model);
        if (existing) {
          if (merge && model !== existing) {
            var attrs = this._isModel(model) ? model.attributes : model;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort) sort = existing.hasChanged(sortAttr);
          }
          if (!modelMap[existing.cid]) {
            modelMap[existing.cid] = true;
            set.push(existing);
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(model, options);
          if (model) {
            toAdd.push(model);
            this._addReference(model, options);
            modelMap[model.cid] = true;
            set.push(model);
          }
        }
      }

      // Remove stale models.
      if (remove) {
        for (i = 0; i < this.length; i++) {
          model = this.models[i];
          if (!modelMap[model.cid]) toRemove.push(model);
        }
        if (toRemove.length) this._removeModels(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      var orderChanged = false;
      var replace = !sortable && add && remove;
      if (set.length && replace) {
        orderChanged = this.length != set.length || _.some(this.models, function(model, index) {
          return model !== set[index];
        });
        this.models.length = 0;
        splice(this.models, set, 0);
        this.length = this.models.length;
      } else if (toAdd.length) {
        if (sortable) sort = true;
        splice(this.models, toAdd, at == null ? this.length : at);
        this.length = this.models.length;
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0; i < toAdd.length; i++) {
          if (at != null) options.index = at + i;
          model = toAdd[i];
          model.trigger('add', model, this, options);
        }
        if (sort || orderChanged) this.trigger('sort', this, options);
        if (toAdd.length || toRemove.length) this.trigger('update', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options = options ? _.clone(options) : {};
      for (var i = 0; i < this.models.length; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      return this.remove(model, options);
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      return this.remove(model, options);
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      var id = this.modelId(this._isModel(obj) ? obj.attributes : obj);
      return this._byId[obj] || this._byId[id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function(index) {
      if (index < 0) index += this.length;
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      return this[first ? 'find' : 'filter'](attrs);
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      var comparator = this.comparator;
      if (!comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      var length = comparator.length;
      if (_.isFunction(comparator)) comparator = _.bind(comparator, this);

      // Run sort based on type of `comparator`.
      if (length === 1 || _.isString(comparator)) {
        this.models = this.sortBy(comparator);
      } else {
        this.models.sort(comparator);
      }
      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = _.extend({parse: true}, options);
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success.call(options.context, collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      var wait = options.wait;
      model = this._prepareModel(model, options);
      if (!model) return false;
      if (!wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp, callbackOpts) {
        if (wait) collection.add(model, callbackOpts);
        if (success) success.call(callbackOpts.context, model, resp, callbackOpts);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models, {
        model: this.model,
        comparator: this.comparator
      });
    },

    // Define how to uniquely identify models in the collection.
    modelId: function (attrs) {
      return attrs[this.model.prototype.idAttribute || 'id'];
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (this._isModel(attrs)) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Internal method called by both remove and set.
    _removeModels: function(models, options) {
      var removed = [];
      for (var i = 0; i < models.length; i++) {
        var model = this.get(models[i]);
        if (!model) continue;

        var index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;

        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }

        removed.push(model);
        this._removeReference(model, options);
      }
      return removed.length ? removed : false;
    },

    // Method for checking whether an object should be considered a model for
    // the purposes of adding to the collection.
    _isModel: function (model) {
      return model instanceof Model;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      var id = this.modelId(model.attributes);
      if (id != null) this._byId[id] = model;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      delete this._byId[model.cid];
      var id = this.modelId(model.attributes);
      if (id != null) delete this._byId[id];
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (event === 'change') {
        var prevId = this.modelId(model.previousAttributes());
        var id = this.modelId(model.attributes);
        if (prevId !== id) {
          if (prevId != null) delete this._byId[prevId];
          if (id != null) this._byId[id] = model;
        }
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var collectionMethods = { forEach: 3, each: 3, map: 3, collect: 3, reduce: 4,
      foldl: 4, inject: 4, reduceRight: 4, foldr: 4, find: 3, detect: 3, filter: 3,
      select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3,
      contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3,
      head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3,
      without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3,
      isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3,
      sortBy: 3, indexBy: 3};

  // Mix in each Underscore method as a proxy to `Collection#models`.
  addUnderscoreMethods(Collection, collectionMethods, 'models');

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be set as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this._removeElement();
      this.stopListening();
      return this;
    },

    // Remove this view's element from the document and all event listeners
    // attached to it. Exposed for subclasses using an alternative DOM
    // manipulation API.
    _removeElement: function() {
      this.$el.remove();
    },

    // Change the view's element (`this.el` property) and re-delegate the
    // view's events on the new element.
    setElement: function(element) {
      this.undelegateEvents();
      this._setElement(element);
      this.delegateEvents();
      return this;
    },

    // Creates the `this.el` and `this.$el` references for this view using the
    // given `el`. `el` can be a CSS selector or an HTML string, a jQuery
    // context or an element. Subclasses can override this to utilize an
    // alternative DOM manipulation API and are only required to set the
    // `this.el` property.
    _setElement: function(el) {
      this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
      this.el = this.$el[0];
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    delegateEvents: function(events) {
      events || (events = _.result(this, 'events'));
      if (!events) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[method];
        if (!method) continue;
        var match = key.match(delegateEventSplitter);
        this.delegate(match[1], match[2], _.bind(method, this));
      }
      return this;
    },

    // Add a single event listener to the view's element (or a child element
    // using `selector`). This only works for delegate-able events: not `focus`,
    // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
    delegate: function(eventName, selector, listener) {
      this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
      return this;
    },

    // Clears all callbacks previously bound to the view by `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      if (this.$el) this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // A finer-grained `undelegateEvents` for removing a single delegated event.
    // `selector` and `listener` are both optional.
    undelegate: function(eventName, selector, listener) {
      this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
      return this;
    },

    // Produces a DOM element to be assigned to your view. Exposed for
    // subclasses using an alternative DOM manipulation API.
    _createElement: function(tagName) {
      return document.createElement(tagName);
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        this.setElement(this._createElement(_.result(this, 'tagName')));
        this._setAttributes(attrs);
      } else {
        this.setElement(_.result(this, 'el'));
      }
    },

    // Set attributes from a hash on this view's element.  Exposed for
    // subclasses using an alternative DOM manipulation API.
    _setAttributes: function(attributes) {
      this.$el.attr(attributes);
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // Pass along `textStatus` and `errorThrown` from jQuery.
    var error = options.error;
    options.error = function(xhr, textStatus, errorThrown) {
      options.textStatus = textStatus;
      options.errorThrown = errorThrown;
      if (error) error.call(options.context, xhr, textStatus, errorThrown);
    };

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        if (router.execute(callback, args, name) !== false) {
          router.trigger.apply(router, ['route:' + name].concat(args));
          router.trigger('route', name, args);
          Backbone.history.trigger('route', router, name, args);
        }
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args, name) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    this.checkUrl = _.bind(this.checkUrl, this);

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      var path = this.location.pathname.replace(/[^\/]$/, '$&/');
      return path === this.root && !this.getSearch();
    },

    // Does the pathname match the root?
    matchRoot: function() {
      var path = this.decodeFragment(this.location.pathname);
      var root = path.slice(0, this.root.length - 1) + '/';
      return root === this.root;
    },

    // Unicode characters in `location.pathname` are percent encoded so they're
    // decoded for comparison. `%25` should not be decoded since it may be part
    // of an encoded parameter.
    decodeFragment: function(fragment) {
      return decodeURI(fragment.replace(/%25/g, '%2525'));
    },

    // In IE6, the hash fragment and search params are incorrect if the
    // fragment contains `?`.
    getSearch: function() {
      var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
      return match ? match[0] : '';
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the pathname and search params, without the root.
    getPath: function() {
      var path = this.decodeFragment(
        this.location.pathname + this.getSearch()
      ).slice(this.root.length - 1);
      return path.charAt(0) === '/' ? path.slice(1) : path;
    },

    // Get the cross-browser normalized URL fragment from the path or hash.
    getFragment: function(fragment) {
      if (fragment == null) {
        if (this._usePushState || !this._wantsHashChange) {
          fragment = this.getPath();
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error('Backbone.history has already been started');
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._hasHashChange   = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);
      this._useHashChange   = this._wantsHashChange && this._hasHashChange;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.history && this.history.pushState);
      this._usePushState    = this._wantsPushState && this._hasPushState;
      this.fragment         = this.getFragment();

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          var root = this.root.slice(0, -1) || '/';
          this.location.replace(root + '#' + this.getPath());
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot()) {
          this.navigate(this.getHash(), {replace: true});
        }

      }

      // Proxy an iframe to handle location events if the browser doesn't
      // support the `hashchange` event, HTML5 history, or the user wants
      // `hashChange` but not `pushState`.
      if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
        this.iframe = document.createElement('iframe');
        this.iframe.src = 'javascript:0';
        this.iframe.style.display = 'none';
        this.iframe.tabIndex = -1;
        var body = document.body;
        // Using `appendChild` will throw on IE < 9 if the document is not ready.
        var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
        iWindow.document.open();
        iWindow.document.close();
        iWindow.location.hash = '#' + this.fragment;
      }

      // Add a cross-platform `addEventListener` shim for older browsers.
      var addEventListener = window.addEventListener || function (eventName, listener) {
        return attachEvent('on' + eventName, listener);
      };

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._usePushState) {
        addEventListener('popstate', this.checkUrl, false);
      } else if (this._useHashChange && !this.iframe) {
        addEventListener('hashchange', this.checkUrl, false);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      // Add a cross-platform `removeEventListener` shim for older browsers.
      var removeEventListener = window.removeEventListener || function (eventName, listener) {
        return detachEvent('on' + eventName, listener);
      };

      // Remove window listeners.
      if (this._usePushState) {
        removeEventListener('popstate', this.checkUrl, false);
      } else if (this._useHashChange && !this.iframe) {
        removeEventListener('hashchange', this.checkUrl, false);
      }

      // Clean up the iframe if necessary.
      if (this.iframe) {
        document.body.removeChild(this.iframe);
        this.iframe = null;
      }

      // Some environments will throw when clearing an undefined interval.
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();

      // If the user pressed the back button, the iframe's hash will have
      // changed and we should use that for comparison.
      if (current === this.fragment && this.iframe) {
        current = this.getHash(this.iframe.contentWindow);
      }

      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      // If the root doesn't match, no routes can match either.
      if (!this.matchRoot()) return false;
      fragment = this.fragment = this.getFragment(fragment);
      return _.some(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      // Normalize the fragment.
      fragment = this.getFragment(fragment || '');

      // Don't include a trailing slash on the root.
      var root = this.root;
      if (fragment === '' || fragment.charAt(0) === '?') {
        root = root.slice(0, -1) || '/';
      }
      var url = root + fragment;

      // Strip the hash and decode for matching.
      fragment = this.decodeFragment(fragment.replace(pathStripper, ''));

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._usePushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
          var iWindow = this.iframe.contentWindow;

          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if (!options.replace) {
            iWindow.document.open();
            iWindow.document.close();
          }

          this._updateHash(iWindow.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent` constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error.call(options.context, model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsaWIvYmFja2JvbmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gICAgIEJhY2tib25lLmpzIDEuMi4zXG5cbi8vICAgICAoYykgMjAxMC0yMDE1IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4vLyAgICAgQmFja2JvbmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4vLyAgICAgRm9yIGFsbCBkZXRhaWxzIGFuZCBkb2N1bWVudGF0aW9uOlxuLy8gICAgIGh0dHA6Ly9iYWNrYm9uZWpzLm9yZ1xuXG4oZnVuY3Rpb24oZmFjdG9yeSkge1xuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIChgc2VsZmApIGluIHRoZSBicm93c2VyLCBvciBgZ2xvYmFsYCBvbiB0aGUgc2VydmVyLlxuICAvLyBXZSB1c2UgYHNlbGZgIGluc3RlYWQgb2YgYHdpbmRvd2AgZm9yIGBXZWJXb3JrZXJgIHN1cHBvcnQuXG4gIHZhciByb290ID0gKHR5cGVvZiBzZWxmID09ICdvYmplY3QnICYmIHNlbGYuc2VsZiA9PSBzZWxmICYmIHNlbGYpIHx8XG4gICAgICAgICAgICAodHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwuZ2xvYmFsID09IGdsb2JhbCAmJiBnbG9iYWwpO1xuXG4gIC8vIFNldCB1cCBCYWNrYm9uZSBhcHByb3ByaWF0ZWx5IGZvciB0aGUgZW52aXJvbm1lbnQuIFN0YXJ0IHdpdGggQU1ELlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFsndW5kZXJzY29yZScsICdqcXVlcnknLCAnZXhwb3J0cyddLCBmdW5jdGlvbihfLCAkLCBleHBvcnRzKSB7XG4gICAgICAvLyBFeHBvcnQgZ2xvYmFsIGV2ZW4gaW4gQU1EIGNhc2UgaW4gY2FzZSB0aGlzIHNjcmlwdCBpcyBsb2FkZWQgd2l0aFxuICAgICAgLy8gb3RoZXJzIHRoYXQgbWF5IHN0aWxsIGV4cGVjdCBhIGdsb2JhbCBCYWNrYm9uZS5cbiAgICAgIHJvb3QuQmFja2JvbmUgPSBmYWN0b3J5KHJvb3QsIGV4cG9ydHMsIF8sICQpO1xuICAgIH0pO1xuXG4gIC8vIE5leHQgZm9yIE5vZGUuanMgb3IgQ29tbW9uSlMuIGpRdWVyeSBtYXkgbm90IGJlIG5lZWRlZCBhcyBhIG1vZHVsZS5cbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKSwgJDtcbiAgICB0cnkgeyAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7IH0gY2F0Y2goZSkge31cbiAgICBmYWN0b3J5KHJvb3QsIGV4cG9ydHMsIF8sICQpO1xuXG4gIC8vIEZpbmFsbHksIGFzIGEgYnJvd3NlciBnbG9iYWwuXG4gIH0gZWxzZSB7XG4gICAgcm9vdC5CYWNrYm9uZSA9IGZhY3Rvcnkocm9vdCwge30sIHJvb3QuXywgKHJvb3QualF1ZXJ5IHx8IHJvb3QuWmVwdG8gfHwgcm9vdC5lbmRlciB8fCByb290LiQpKTtcbiAgfVxuXG59KGZ1bmN0aW9uKHJvb3QsIEJhY2tib25lLCBfLCAkKSB7XG5cbiAgLy8gSW5pdGlhbCBTZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tXG5cbiAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGBCYWNrYm9uZWAgdmFyaWFibGUsIHNvIHRoYXQgaXQgY2FuIGJlXG4gIC8vIHJlc3RvcmVkIGxhdGVyIG9uLCBpZiBgbm9Db25mbGljdGAgaXMgdXNlZC5cbiAgdmFyIHByZXZpb3VzQmFja2JvbmUgPSByb290LkJhY2tib25lO1xuXG4gIC8vIENyZWF0ZSBhIGxvY2FsIHJlZmVyZW5jZSB0byBhIGNvbW1vbiBhcnJheSBtZXRob2Qgd2UnbGwgd2FudCB0byB1c2UgbGF0ZXIuXG4gIHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICAvLyBDdXJyZW50IHZlcnNpb24gb2YgdGhlIGxpYnJhcnkuIEtlZXAgaW4gc3luYyB3aXRoIGBwYWNrYWdlLmpzb25gLlxuICBCYWNrYm9uZS5WRVJTSU9OID0gJzEuMi4zJztcblxuICAvLyBGb3IgQmFja2JvbmUncyBwdXJwb3NlcywgalF1ZXJ5LCBaZXB0bywgRW5kZXIsIG9yIE15IExpYnJhcnkgKGtpZGRpbmcpIG93bnNcbiAgLy8gdGhlIGAkYCB2YXJpYWJsZS5cbiAgQmFja2JvbmUuJCA9ICQ7XG5cbiAgLy8gUnVucyBCYWNrYm9uZS5qcyBpbiAqbm9Db25mbGljdCogbW9kZSwgcmV0dXJuaW5nIHRoZSBgQmFja2JvbmVgIHZhcmlhYmxlXG4gIC8vIHRvIGl0cyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGlzIEJhY2tib25lIG9iamVjdC5cbiAgQmFja2JvbmUubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuQmFja2JvbmUgPSBwcmV2aW91c0JhY2tib25lO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIFR1cm4gb24gYGVtdWxhdGVIVFRQYCB0byBzdXBwb3J0IGxlZ2FjeSBIVFRQIHNlcnZlcnMuIFNldHRpbmcgdGhpcyBvcHRpb25cbiAgLy8gd2lsbCBmYWtlIGBcIlBBVENIXCJgLCBgXCJQVVRcImAgYW5kIGBcIkRFTEVURVwiYCByZXF1ZXN0cyB2aWEgdGhlIGBfbWV0aG9kYCBwYXJhbWV0ZXIgYW5kXG4gIC8vIHNldCBhIGBYLUh0dHAtTWV0aG9kLU92ZXJyaWRlYCBoZWFkZXIuXG4gIEJhY2tib25lLmVtdWxhdGVIVFRQID0gZmFsc2U7XG5cbiAgLy8gVHVybiBvbiBgZW11bGF0ZUpTT05gIHRvIHN1cHBvcnQgbGVnYWN5IHNlcnZlcnMgdGhhdCBjYW4ndCBkZWFsIHdpdGggZGlyZWN0XG4gIC8vIGBhcHBsaWNhdGlvbi9qc29uYCByZXF1ZXN0cyAuLi4gdGhpcyB3aWxsIGVuY29kZSB0aGUgYm9keSBhc1xuICAvLyBgYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkYCBpbnN0ZWFkIGFuZCB3aWxsIHNlbmQgdGhlIG1vZGVsIGluIGFcbiAgLy8gZm9ybSBwYXJhbSBuYW1lZCBgbW9kZWxgLlxuICBCYWNrYm9uZS5lbXVsYXRlSlNPTiA9IGZhbHNlO1xuXG4gIC8vIFByb3h5IEJhY2tib25lIGNsYXNzIG1ldGhvZHMgdG8gVW5kZXJzY29yZSBmdW5jdGlvbnMsIHdyYXBwaW5nIHRoZSBtb2RlbCdzXG4gIC8vIGBhdHRyaWJ1dGVzYCBvYmplY3Qgb3IgY29sbGVjdGlvbidzIGBtb2RlbHNgIGFycmF5IGJlaGluZCB0aGUgc2NlbmVzLlxuICAvL1xuICAvLyBjb2xsZWN0aW9uLmZpbHRlcihmdW5jdGlvbihtb2RlbCkgeyByZXR1cm4gbW9kZWwuZ2V0KCdhZ2UnKSA+IDEwIH0pO1xuICAvLyBjb2xsZWN0aW9uLmVhY2godGhpcy5hZGRWaWV3KTtcbiAgLy9cbiAgLy8gYEZ1bmN0aW9uI2FwcGx5YCBjYW4gYmUgc2xvdyBzbyB3ZSB1c2UgdGhlIG1ldGhvZCdzIGFyZyBjb3VudCwgaWYgd2Uga25vdyBpdC5cbiAgdmFyIGFkZE1ldGhvZCA9IGZ1bmN0aW9uKGxlbmd0aCwgbWV0aG9kLCBhdHRyaWJ1dGUpIHtcbiAgICBzd2l0Y2ggKGxlbmd0aCkge1xuICAgICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBfW21ldGhvZF0odGhpc1thdHRyaWJ1dGVdKTtcbiAgICAgIH07XG4gICAgICBjYXNlIDI6IHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gX1ttZXRob2RdKHRoaXNbYXR0cmlidXRlXSwgdmFsdWUpO1xuICAgICAgfTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiBfW21ldGhvZF0odGhpc1thdHRyaWJ1dGVdLCBjYihpdGVyYXRlZSwgdGhpcyksIGNvbnRleHQpO1xuICAgICAgfTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGZ1bmN0aW9uKGl0ZXJhdGVlLCBkZWZhdWx0VmFsLCBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiBfW21ldGhvZF0odGhpc1thdHRyaWJ1dGVdLCBjYihpdGVyYXRlZSwgdGhpcyksIGRlZmF1bHRWYWwsIGNvbnRleHQpO1xuICAgICAgfTtcbiAgICAgIGRlZmF1bHQ6IHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIGFyZ3MudW5zaGlmdCh0aGlzW2F0dHJpYnV0ZV0pO1xuICAgICAgICByZXR1cm4gX1ttZXRob2RdLmFwcGx5KF8sIGFyZ3MpO1xuICAgICAgfTtcbiAgICB9XG4gIH07XG4gIHZhciBhZGRVbmRlcnNjb3JlTWV0aG9kcyA9IGZ1bmN0aW9uKENsYXNzLCBtZXRob2RzLCBhdHRyaWJ1dGUpIHtcbiAgICBfLmVhY2gobWV0aG9kcywgZnVuY3Rpb24obGVuZ3RoLCBtZXRob2QpIHtcbiAgICAgIGlmIChfW21ldGhvZF0pIENsYXNzLnByb3RvdHlwZVttZXRob2RdID0gYWRkTWV0aG9kKGxlbmd0aCwgbWV0aG9kLCBhdHRyaWJ1dGUpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFN1cHBvcnQgYGNvbGxlY3Rpb24uc29ydEJ5KCdhdHRyJylgIGFuZCBgY29sbGVjdGlvbi5maW5kV2hlcmUoe2lkOiAxfSlgLlxuICB2YXIgY2IgPSBmdW5jdGlvbihpdGVyYXRlZSwgaW5zdGFuY2UpIHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGl0ZXJhdGVlKSkgcmV0dXJuIGl0ZXJhdGVlO1xuICAgIGlmIChfLmlzT2JqZWN0KGl0ZXJhdGVlKSAmJiAhaW5zdGFuY2UuX2lzTW9kZWwoaXRlcmF0ZWUpKSByZXR1cm4gbW9kZWxNYXRjaGVyKGl0ZXJhdGVlKTtcbiAgICBpZiAoXy5pc1N0cmluZyhpdGVyYXRlZSkpIHJldHVybiBmdW5jdGlvbihtb2RlbCkgeyByZXR1cm4gbW9kZWwuZ2V0KGl0ZXJhdGVlKTsgfTtcbiAgICByZXR1cm4gaXRlcmF0ZWU7XG4gIH07XG4gIHZhciBtb2RlbE1hdGNoZXIgPSBmdW5jdGlvbihhdHRycykge1xuICAgIHZhciBtYXRjaGVyID0gXy5tYXRjaGVzKGF0dHJzKTtcbiAgICByZXR1cm4gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHJldHVybiBtYXRjaGVyKG1vZGVsLmF0dHJpYnV0ZXMpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gQmFja2JvbmUuRXZlbnRzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEEgbW9kdWxlIHRoYXQgY2FuIGJlIG1peGVkIGluIHRvICphbnkgb2JqZWN0KiBpbiBvcmRlciB0byBwcm92aWRlIGl0IHdpdGhcbiAgLy8gYSBjdXN0b20gZXZlbnQgY2hhbm5lbC4gWW91IG1heSBiaW5kIGEgY2FsbGJhY2sgdG8gYW4gZXZlbnQgd2l0aCBgb25gIG9yXG4gIC8vIHJlbW92ZSB3aXRoIGBvZmZgOyBgdHJpZ2dlcmAtaW5nIGFuIGV2ZW50IGZpcmVzIGFsbCBjYWxsYmFja3MgaW5cbiAgLy8gc3VjY2Vzc2lvbi5cbiAgLy9cbiAgLy8gICAgIHZhciBvYmplY3QgPSB7fTtcbiAgLy8gICAgIF8uZXh0ZW5kKG9iamVjdCwgQmFja2JvbmUuRXZlbnRzKTtcbiAgLy8gICAgIG9iamVjdC5vbignZXhwYW5kJywgZnVuY3Rpb24oKXsgYWxlcnQoJ2V4cGFuZGVkJyk7IH0pO1xuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIoJ2V4cGFuZCcpO1xuICAvL1xuICB2YXIgRXZlbnRzID0gQmFja2JvbmUuRXZlbnRzID0ge307XG5cbiAgLy8gUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gc3BsaXQgZXZlbnQgc3RyaW5ncy5cbiAgdmFyIGV2ZW50U3BsaXR0ZXIgPSAvXFxzKy87XG5cbiAgLy8gSXRlcmF0ZXMgb3ZlciB0aGUgc3RhbmRhcmQgYGV2ZW50LCBjYWxsYmFja2AgKGFzIHdlbGwgYXMgdGhlIGZhbmN5IG11bHRpcGxlXG4gIC8vIHNwYWNlLXNlcGFyYXRlZCBldmVudHMgYFwiY2hhbmdlIGJsdXJcIiwgY2FsbGJhY2tgIGFuZCBqUXVlcnktc3R5bGUgZXZlbnRcbiAgLy8gbWFwcyBge2V2ZW50OiBjYWxsYmFja31gKS5cbiAgdmFyIGV2ZW50c0FwaSA9IGZ1bmN0aW9uKGl0ZXJhdGVlLCBldmVudHMsIG5hbWUsIGNhbGxiYWNrLCBvcHRzKSB7XG4gICAgdmFyIGkgPSAwLCBuYW1lcztcbiAgICBpZiAobmFtZSAmJiB0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIC8vIEhhbmRsZSBldmVudCBtYXBzLlxuICAgICAgaWYgKGNhbGxiYWNrICE9PSB2b2lkIDAgJiYgJ2NvbnRleHQnIGluIG9wdHMgJiYgb3B0cy5jb250ZXh0ID09PSB2b2lkIDApIG9wdHMuY29udGV4dCA9IGNhbGxiYWNrO1xuICAgICAgZm9yIChuYW1lcyA9IF8ua2V5cyhuYW1lKTsgaSA8IG5hbWVzLmxlbmd0aCA7IGkrKykge1xuICAgICAgICBldmVudHMgPSBldmVudHNBcGkoaXRlcmF0ZWUsIGV2ZW50cywgbmFtZXNbaV0sIG5hbWVbbmFtZXNbaV1dLCBvcHRzKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5hbWUgJiYgZXZlbnRTcGxpdHRlci50ZXN0KG5hbWUpKSB7XG4gICAgICAvLyBIYW5kbGUgc3BhY2Ugc2VwYXJhdGVkIGV2ZW50IG5hbWVzIGJ5IGRlbGVnYXRpbmcgdGhlbSBpbmRpdmlkdWFsbHkuXG4gICAgICBmb3IgKG5hbWVzID0gbmFtZS5zcGxpdChldmVudFNwbGl0dGVyKTsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGV2ZW50cyA9IGl0ZXJhdGVlKGV2ZW50cywgbmFtZXNbaV0sIGNhbGxiYWNrLCBvcHRzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRmluYWxseSwgc3RhbmRhcmQgZXZlbnRzLlxuICAgICAgZXZlbnRzID0gaXRlcmF0ZWUoZXZlbnRzLCBuYW1lLCBjYWxsYmFjaywgb3B0cyk7XG4gICAgfVxuICAgIHJldHVybiBldmVudHM7XG4gIH07XG5cbiAgLy8gQmluZCBhbiBldmVudCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uIFBhc3NpbmcgYFwiYWxsXCJgIHdpbGwgYmluZFxuICAvLyB0aGUgY2FsbGJhY2sgdG8gYWxsIGV2ZW50cyBmaXJlZC5cbiAgRXZlbnRzLm9uID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICByZXR1cm4gaW50ZXJuYWxPbih0aGlzLCBuYW1lLCBjYWxsYmFjaywgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gR3VhcmQgdGhlIGBsaXN0ZW5pbmdgIGFyZ3VtZW50IGZyb20gdGhlIHB1YmxpYyBBUEkuXG4gIHZhciBpbnRlcm5hbE9uID0gZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaywgY29udGV4dCwgbGlzdGVuaW5nKSB7XG4gICAgb2JqLl9ldmVudHMgPSBldmVudHNBcGkob25BcGksIG9iai5fZXZlbnRzIHx8IHt9LCBuYW1lLCBjYWxsYmFjaywge1xuICAgICAgICBjb250ZXh0OiBjb250ZXh0LFxuICAgICAgICBjdHg6IG9iaixcbiAgICAgICAgbGlzdGVuaW5nOiBsaXN0ZW5pbmdcbiAgICB9KTtcblxuICAgIGlmIChsaXN0ZW5pbmcpIHtcbiAgICAgIHZhciBsaXN0ZW5lcnMgPSBvYmouX2xpc3RlbmVycyB8fCAob2JqLl9saXN0ZW5lcnMgPSB7fSk7XG4gICAgICBsaXN0ZW5lcnNbbGlzdGVuaW5nLmlkXSA9IGxpc3RlbmluZztcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIEludmVyc2lvbi1vZi1jb250cm9sIHZlcnNpb25zIG9mIGBvbmAuIFRlbGwgKnRoaXMqIG9iamVjdCB0byBsaXN0ZW4gdG9cbiAgLy8gYW4gZXZlbnQgaW4gYW5vdGhlciBvYmplY3QuLi4ga2VlcGluZyB0cmFjayBvZiB3aGF0IGl0J3MgbGlzdGVuaW5nIHRvXG4gIC8vIGZvciBlYXNpZXIgdW5iaW5kaW5nIGxhdGVyLlxuICBFdmVudHMubGlzdGVuVG8gPSAgZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICghb2JqKSByZXR1cm4gdGhpcztcbiAgICB2YXIgaWQgPSBvYmouX2xpc3RlbklkIHx8IChvYmouX2xpc3RlbklkID0gXy51bmlxdWVJZCgnbCcpKTtcbiAgICB2YXIgbGlzdGVuaW5nVG8gPSB0aGlzLl9saXN0ZW5pbmdUbyB8fCAodGhpcy5fbGlzdGVuaW5nVG8gPSB7fSk7XG4gICAgdmFyIGxpc3RlbmluZyA9IGxpc3RlbmluZ1RvW2lkXTtcblxuICAgIC8vIFRoaXMgb2JqZWN0IGlzIG5vdCBsaXN0ZW5pbmcgdG8gYW55IG90aGVyIGV2ZW50cyBvbiBgb2JqYCB5ZXQuXG4gICAgLy8gU2V0dXAgdGhlIG5lY2Vzc2FyeSByZWZlcmVuY2VzIHRvIHRyYWNrIHRoZSBsaXN0ZW5pbmcgY2FsbGJhY2tzLlxuICAgIGlmICghbGlzdGVuaW5nKSB7XG4gICAgICB2YXIgdGhpc0lkID0gdGhpcy5fbGlzdGVuSWQgfHwgKHRoaXMuX2xpc3RlbklkID0gXy51bmlxdWVJZCgnbCcpKTtcbiAgICAgIGxpc3RlbmluZyA9IGxpc3RlbmluZ1RvW2lkXSA9IHtvYmo6IG9iaiwgb2JqSWQ6IGlkLCBpZDogdGhpc0lkLCBsaXN0ZW5pbmdUbzogbGlzdGVuaW5nVG8sIGNvdW50OiAwfTtcbiAgICB9XG5cbiAgICAvLyBCaW5kIGNhbGxiYWNrcyBvbiBvYmosIGFuZCBrZWVwIHRyYWNrIG9mIHRoZW0gb24gbGlzdGVuaW5nLlxuICAgIGludGVybmFsT24ob2JqLCBuYW1lLCBjYWxsYmFjaywgdGhpcywgbGlzdGVuaW5nKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBUaGUgcmVkdWNpbmcgQVBJIHRoYXQgYWRkcyBhIGNhbGxiYWNrIHRvIHRoZSBgZXZlbnRzYCBvYmplY3QuXG4gIHZhciBvbkFwaSA9IGZ1bmN0aW9uKGV2ZW50cywgbmFtZSwgY2FsbGJhY2ssIG9wdGlvbnMpIHtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIHZhciBoYW5kbGVycyA9IGV2ZW50c1tuYW1lXSB8fCAoZXZlbnRzW25hbWVdID0gW10pO1xuICAgICAgdmFyIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQsIGN0eCA9IG9wdGlvbnMuY3R4LCBsaXN0ZW5pbmcgPSBvcHRpb25zLmxpc3RlbmluZztcbiAgICAgIGlmIChsaXN0ZW5pbmcpIGxpc3RlbmluZy5jb3VudCsrO1xuXG4gICAgICBoYW5kbGVycy5wdXNoKHsgY2FsbGJhY2s6IGNhbGxiYWNrLCBjb250ZXh0OiBjb250ZXh0LCBjdHg6IGNvbnRleHQgfHwgY3R4LCBsaXN0ZW5pbmc6IGxpc3RlbmluZyB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50cztcbiAgfTtcblxuICAvLyBSZW1vdmUgb25lIG9yIG1hbnkgY2FsbGJhY2tzLiBJZiBgY29udGV4dGAgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcbiAgLy8gY2FsbGJhY2tzIHdpdGggdGhhdCBmdW5jdGlvbi4gSWYgYGNhbGxiYWNrYCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAvLyBjYWxsYmFja3MgZm9yIHRoZSBldmVudC4gSWYgYG5hbWVgIGlzIG51bGwsIHJlbW92ZXMgYWxsIGJvdW5kXG4gIC8vIGNhbGxiYWNrcyBmb3IgYWxsIGV2ZW50cy5cbiAgRXZlbnRzLm9mZiA9ICBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcbiAgICB0aGlzLl9ldmVudHMgPSBldmVudHNBcGkob2ZmQXBpLCB0aGlzLl9ldmVudHMsIG5hbWUsIGNhbGxiYWNrLCB7XG4gICAgICAgIGNvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgIGxpc3RlbmVyczogdGhpcy5fbGlzdGVuZXJzXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gVGVsbCB0aGlzIG9iamVjdCB0byBzdG9wIGxpc3RlbmluZyB0byBlaXRoZXIgc3BlY2lmaWMgZXZlbnRzIC4uLiBvclxuICAvLyB0byBldmVyeSBvYmplY3QgaXQncyBjdXJyZW50bHkgbGlzdGVuaW5nIHRvLlxuICBFdmVudHMuc3RvcExpc3RlbmluZyA9ICBmdW5jdGlvbihvYmosIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGxpc3RlbmluZ1RvID0gdGhpcy5fbGlzdGVuaW5nVG87XG4gICAgaWYgKCFsaXN0ZW5pbmdUbykgcmV0dXJuIHRoaXM7XG5cbiAgICB2YXIgaWRzID0gb2JqID8gW29iai5fbGlzdGVuSWRdIDogXy5rZXlzKGxpc3RlbmluZ1RvKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgbGlzdGVuaW5nID0gbGlzdGVuaW5nVG9baWRzW2ldXTtcblxuICAgICAgLy8gSWYgbGlzdGVuaW5nIGRvZXNuJ3QgZXhpc3QsIHRoaXMgb2JqZWN0IGlzIG5vdCBjdXJyZW50bHlcbiAgICAgIC8vIGxpc3RlbmluZyB0byBvYmouIEJyZWFrIG91dCBlYXJseS5cbiAgICAgIGlmICghbGlzdGVuaW5nKSBicmVhaztcblxuICAgICAgbGlzdGVuaW5nLm9iai5vZmYobmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgIH1cbiAgICBpZiAoXy5pc0VtcHR5KGxpc3RlbmluZ1RvKSkgdGhpcy5fbGlzdGVuaW5nVG8gPSB2b2lkIDA7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBUaGUgcmVkdWNpbmcgQVBJIHRoYXQgcmVtb3ZlcyBhIGNhbGxiYWNrIGZyb20gdGhlIGBldmVudHNgIG9iamVjdC5cbiAgdmFyIG9mZkFwaSA9IGZ1bmN0aW9uKGV2ZW50cywgbmFtZSwgY2FsbGJhY2ssIG9wdGlvbnMpIHtcbiAgICBpZiAoIWV2ZW50cykgcmV0dXJuO1xuXG4gICAgdmFyIGkgPSAwLCBsaXN0ZW5pbmc7XG4gICAgdmFyIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQsIGxpc3RlbmVycyA9IG9wdGlvbnMubGlzdGVuZXJzO1xuXG4gICAgLy8gRGVsZXRlIGFsbCBldmVudHMgbGlzdGVuZXJzIGFuZCBcImRyb3BcIiBldmVudHMuXG4gICAgaWYgKCFuYW1lICYmICFjYWxsYmFjayAmJiAhY29udGV4dCkge1xuICAgICAgdmFyIGlkcyA9IF8ua2V5cyhsaXN0ZW5lcnMpO1xuICAgICAgZm9yICg7IGkgPCBpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGlzdGVuaW5nID0gbGlzdGVuZXJzW2lkc1tpXV07XG4gICAgICAgIGRlbGV0ZSBsaXN0ZW5lcnNbbGlzdGVuaW5nLmlkXTtcbiAgICAgICAgZGVsZXRlIGxpc3RlbmluZy5saXN0ZW5pbmdUb1tsaXN0ZW5pbmcub2JqSWRdO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBuYW1lcyA9IG5hbWUgPyBbbmFtZV0gOiBfLmtleXMoZXZlbnRzKTtcbiAgICBmb3IgKDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBuYW1lID0gbmFtZXNbaV07XG4gICAgICB2YXIgaGFuZGxlcnMgPSBldmVudHNbbmFtZV07XG5cbiAgICAgIC8vIEJhaWwgb3V0IGlmIHRoZXJlIGFyZSBubyBldmVudHMgc3RvcmVkLlxuICAgICAgaWYgKCFoYW5kbGVycykgYnJlYWs7XG5cbiAgICAgIC8vIFJlcGxhY2UgZXZlbnRzIGlmIHRoZXJlIGFyZSBhbnkgcmVtYWluaW5nLiAgT3RoZXJ3aXNlLCBjbGVhbiB1cC5cbiAgICAgIHZhciByZW1haW5pbmcgPSBbXTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgaGFuZGxlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIGhhbmRsZXIgPSBoYW5kbGVyc1tqXTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrICE9PSBoYW5kbGVyLmNhbGxiYWNrICYmXG4gICAgICAgICAgICBjYWxsYmFjayAhPT0gaGFuZGxlci5jYWxsYmFjay5fY2FsbGJhY2sgfHxcbiAgICAgICAgICAgICAgY29udGV4dCAmJiBjb250ZXh0ICE9PSBoYW5kbGVyLmNvbnRleHRcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmVtYWluaW5nLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGlzdGVuaW5nID0gaGFuZGxlci5saXN0ZW5pbmc7XG4gICAgICAgICAgaWYgKGxpc3RlbmluZyAmJiAtLWxpc3RlbmluZy5jb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgZGVsZXRlIGxpc3RlbmVyc1tsaXN0ZW5pbmcuaWRdO1xuICAgICAgICAgICAgZGVsZXRlIGxpc3RlbmluZy5saXN0ZW5pbmdUb1tsaXN0ZW5pbmcub2JqSWRdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgdGFpbCBldmVudCBpZiB0aGUgbGlzdCBoYXMgYW55IGV2ZW50cy4gIE90aGVyd2lzZSwgY2xlYW4gdXAuXG4gICAgICBpZiAocmVtYWluaW5nLmxlbmd0aCkge1xuICAgICAgICBldmVudHNbbmFtZV0gPSByZW1haW5pbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgZXZlbnRzW25hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoXy5zaXplKGV2ZW50cykpIHJldHVybiBldmVudHM7XG4gIH07XG5cbiAgLy8gQmluZCBhbiBldmVudCB0byBvbmx5IGJlIHRyaWdnZXJlZCBhIHNpbmdsZSB0aW1lLiBBZnRlciB0aGUgZmlyc3QgdGltZVxuICAvLyB0aGUgY2FsbGJhY2sgaXMgaW52b2tlZCwgaXRzIGxpc3RlbmVyIHdpbGwgYmUgcmVtb3ZlZC4gSWYgbXVsdGlwbGUgZXZlbnRzXG4gIC8vIGFyZSBwYXNzZWQgaW4gdXNpbmcgdGhlIHNwYWNlLXNlcGFyYXRlZCBzeW50YXgsIHRoZSBoYW5kbGVyIHdpbGwgZmlyZVxuICAvLyBvbmNlIGZvciBlYWNoIGV2ZW50LCBub3Qgb25jZSBmb3IgYSBjb21iaW5hdGlvbiBvZiBhbGwgZXZlbnRzLlxuICBFdmVudHMub25jZSA9ICBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgIC8vIE1hcCB0aGUgZXZlbnQgaW50byBhIGB7ZXZlbnQ6IG9uY2V9YCBvYmplY3QuXG4gICAgdmFyIGV2ZW50cyA9IGV2ZW50c0FwaShvbmNlTWFwLCB7fSwgbmFtZSwgY2FsbGJhY2ssIF8uYmluZCh0aGlzLm9mZiwgdGhpcykpO1xuICAgIHJldHVybiB0aGlzLm9uKGV2ZW50cywgdm9pZCAwLCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBJbnZlcnNpb24tb2YtY29udHJvbCB2ZXJzaW9ucyBvZiBgb25jZWAuXG4gIEV2ZW50cy5saXN0ZW5Ub09uY2UgPSAgZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgIC8vIE1hcCB0aGUgZXZlbnQgaW50byBhIGB7ZXZlbnQ6IG9uY2V9YCBvYmplY3QuXG4gICAgdmFyIGV2ZW50cyA9IGV2ZW50c0FwaShvbmNlTWFwLCB7fSwgbmFtZSwgY2FsbGJhY2ssIF8uYmluZCh0aGlzLnN0b3BMaXN0ZW5pbmcsIHRoaXMsIG9iaikpO1xuICAgIHJldHVybiB0aGlzLmxpc3RlblRvKG9iaiwgZXZlbnRzKTtcbiAgfTtcblxuICAvLyBSZWR1Y2VzIHRoZSBldmVudCBjYWxsYmFja3MgaW50byBhIG1hcCBvZiBge2V2ZW50OiBvbmNlV3JhcHBlcn1gLlxuICAvLyBgb2ZmZXJgIHVuYmluZHMgdGhlIGBvbmNlV3JhcHBlcmAgYWZ0ZXIgaXQgaGFzIGJlZW4gY2FsbGVkLlxuICB2YXIgb25jZU1hcCA9IGZ1bmN0aW9uKG1hcCwgbmFtZSwgY2FsbGJhY2ssIG9mZmVyKSB7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICB2YXIgb25jZSA9IG1hcFtuYW1lXSA9IF8ub25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgb2ZmZXIobmFtZSwgb25jZSk7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9KTtcbiAgICAgIG9uY2UuX2NhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG4gIH07XG5cbiAgLy8gVHJpZ2dlciBvbmUgb3IgbWFueSBldmVudHMsIGZpcmluZyBhbGwgYm91bmQgY2FsbGJhY2tzLiBDYWxsYmFja3MgYXJlXG4gIC8vIHBhc3NlZCB0aGUgc2FtZSBhcmd1bWVudHMgYXMgYHRyaWdnZXJgIGlzLCBhcGFydCBmcm9tIHRoZSBldmVudCBuYW1lXG4gIC8vICh1bmxlc3MgeW91J3JlIGxpc3RlbmluZyBvbiBgXCJhbGxcImAsIHdoaWNoIHdpbGwgY2F1c2UgeW91ciBjYWxsYmFjayB0b1xuICAvLyByZWNlaXZlIHRoZSB0cnVlIG5hbWUgb2YgdGhlIGV2ZW50IGFzIHRoZSBmaXJzdCBhcmd1bWVudCkuXG4gIEV2ZW50cy50cmlnZ2VyID0gIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cykgcmV0dXJuIHRoaXM7XG5cbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoMCwgYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIHZhciBhcmdzID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSBhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXTtcblxuICAgIGV2ZW50c0FwaSh0cmlnZ2VyQXBpLCB0aGlzLl9ldmVudHMsIG5hbWUsIHZvaWQgMCwgYXJncyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gSGFuZGxlcyB0cmlnZ2VyaW5nIHRoZSBhcHByb3ByaWF0ZSBldmVudCBjYWxsYmFja3MuXG4gIHZhciB0cmlnZ2VyQXBpID0gZnVuY3Rpb24ob2JqRXZlbnRzLCBuYW1lLCBjYiwgYXJncykge1xuICAgIGlmIChvYmpFdmVudHMpIHtcbiAgICAgIHZhciBldmVudHMgPSBvYmpFdmVudHNbbmFtZV07XG4gICAgICB2YXIgYWxsRXZlbnRzID0gb2JqRXZlbnRzLmFsbDtcbiAgICAgIGlmIChldmVudHMgJiYgYWxsRXZlbnRzKSBhbGxFdmVudHMgPSBhbGxFdmVudHMuc2xpY2UoKTtcbiAgICAgIGlmIChldmVudHMpIHRyaWdnZXJFdmVudHMoZXZlbnRzLCBhcmdzKTtcbiAgICAgIGlmIChhbGxFdmVudHMpIHRyaWdnZXJFdmVudHMoYWxsRXZlbnRzLCBbbmFtZV0uY29uY2F0KGFyZ3MpKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iakV2ZW50cztcbiAgfTtcblxuICAvLyBBIGRpZmZpY3VsdC10by1iZWxpZXZlLCBidXQgb3B0aW1pemVkIGludGVybmFsIGRpc3BhdGNoIGZ1bmN0aW9uIGZvclxuICAvLyB0cmlnZ2VyaW5nIGV2ZW50cy4gVHJpZXMgdG8ga2VlcCB0aGUgdXN1YWwgY2FzZXMgc3BlZWR5IChtb3N0IGludGVybmFsXG4gIC8vIEJhY2tib25lIGV2ZW50cyBoYXZlIDMgYXJndW1lbnRzKS5cbiAgdmFyIHRyaWdnZXJFdmVudHMgPSBmdW5jdGlvbihldmVudHMsIGFyZ3MpIHtcbiAgICB2YXIgZXYsIGkgPSAtMSwgbCA9IGV2ZW50cy5sZW5ndGgsIGExID0gYXJnc1swXSwgYTIgPSBhcmdzWzFdLCBhMyA9IGFyZ3NbMl07XG4gICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCk7IHJldHVybjtcbiAgICAgIGNhc2UgMTogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExKTsgcmV0dXJuO1xuICAgICAgY2FzZSAyOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEsIGEyKTsgcmV0dXJuO1xuICAgICAgY2FzZSAzOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEsIGEyLCBhMyk7IHJldHVybjtcbiAgICAgIGRlZmF1bHQ6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmFwcGx5KGV2LmN0eCwgYXJncyk7IHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgLy8gQWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gIEV2ZW50cy5iaW5kICAgPSBFdmVudHMub247XG4gIEV2ZW50cy51bmJpbmQgPSBFdmVudHMub2ZmO1xuXG4gIC8vIEFsbG93IHRoZSBgQmFja2JvbmVgIG9iamVjdCB0byBzZXJ2ZSBhcyBhIGdsb2JhbCBldmVudCBidXMsIGZvciBmb2xrcyB3aG9cbiAgLy8gd2FudCBnbG9iYWwgXCJwdWJzdWJcIiBpbiBhIGNvbnZlbmllbnQgcGxhY2UuXG4gIF8uZXh0ZW5kKEJhY2tib25lLCBFdmVudHMpO1xuXG4gIC8vIEJhY2tib25lLk1vZGVsXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQmFja2JvbmUgKipNb2RlbHMqKiBhcmUgdGhlIGJhc2ljIGRhdGEgb2JqZWN0IGluIHRoZSBmcmFtZXdvcmsgLS1cbiAgLy8gZnJlcXVlbnRseSByZXByZXNlbnRpbmcgYSByb3cgaW4gYSB0YWJsZSBpbiBhIGRhdGFiYXNlIG9uIHlvdXIgc2VydmVyLlxuICAvLyBBIGRpc2NyZXRlIGNodW5rIG9mIGRhdGEgYW5kIGEgYnVuY2ggb2YgdXNlZnVsLCByZWxhdGVkIG1ldGhvZHMgZm9yXG4gIC8vIHBlcmZvcm1pbmcgY29tcHV0YXRpb25zIGFuZCB0cmFuc2Zvcm1hdGlvbnMgb24gdGhhdCBkYXRhLlxuXG4gIC8vIENyZWF0ZSBhIG5ldyBtb2RlbCB3aXRoIHRoZSBzcGVjaWZpZWQgYXR0cmlidXRlcy4gQSBjbGllbnQgaWQgKGBjaWRgKVxuICAvLyBpcyBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBhbmQgYXNzaWduZWQgZm9yIHlvdS5cbiAgdmFyIE1vZGVsID0gQmFja2JvbmUuTW9kZWwgPSBmdW5jdGlvbihhdHRyaWJ1dGVzLCBvcHRpb25zKSB7XG4gICAgdmFyIGF0dHJzID0gYXR0cmlidXRlcyB8fCB7fTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHRoaXMuY2lkID0gXy51bmlxdWVJZCh0aGlzLmNpZFByZWZpeCk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgaWYgKG9wdGlvbnMuY29sbGVjdGlvbikgdGhpcy5jb2xsZWN0aW9uID0gb3B0aW9ucy5jb2xsZWN0aW9uO1xuICAgIGlmIChvcHRpb25zLnBhcnNlKSBhdHRycyA9IHRoaXMucGFyc2UoYXR0cnMsIG9wdGlvbnMpIHx8IHt9O1xuICAgIGF0dHJzID0gXy5kZWZhdWx0cyh7fSwgYXR0cnMsIF8ucmVzdWx0KHRoaXMsICdkZWZhdWx0cycpKTtcbiAgICB0aGlzLnNldChhdHRycywgb3B0aW9ucyk7XG4gICAgdGhpcy5jaGFuZ2VkID0ge307XG4gICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgLy8gQXR0YWNoIGFsbCBpbmhlcml0YWJsZSBtZXRob2RzIHRvIHRoZSBNb2RlbCBwcm90b3R5cGUuXG4gIF8uZXh0ZW5kKE1vZGVsLnByb3RvdHlwZSwgRXZlbnRzLCB7XG5cbiAgICAvLyBBIGhhc2ggb2YgYXR0cmlidXRlcyB3aG9zZSBjdXJyZW50IGFuZCBwcmV2aW91cyB2YWx1ZSBkaWZmZXIuXG4gICAgY2hhbmdlZDogbnVsbCxcblxuICAgIC8vIFRoZSB2YWx1ZSByZXR1cm5lZCBkdXJpbmcgdGhlIGxhc3QgZmFpbGVkIHZhbGlkYXRpb24uXG4gICAgdmFsaWRhdGlvbkVycm9yOiBudWxsLFxuXG4gICAgLy8gVGhlIGRlZmF1bHQgbmFtZSBmb3IgdGhlIEpTT04gYGlkYCBhdHRyaWJ1dGUgaXMgYFwiaWRcImAuIE1vbmdvREIgYW5kXG4gICAgLy8gQ291Y2hEQiB1c2VycyBtYXkgd2FudCB0byBzZXQgdGhpcyB0byBgXCJfaWRcImAuXG4gICAgaWRBdHRyaWJ1dGU6ICdpZCcsXG5cbiAgICAvLyBUaGUgcHJlZml4IGlzIHVzZWQgdG8gY3JlYXRlIHRoZSBjbGllbnQgaWQgd2hpY2ggaXMgdXNlZCB0byBpZGVudGlmeSBtb2RlbHMgbG9jYWxseS5cbiAgICAvLyBZb3UgbWF5IHdhbnQgdG8gb3ZlcnJpZGUgdGhpcyBpZiB5b3UncmUgZXhwZXJpZW5jaW5nIG5hbWUgY2xhc2hlcyB3aXRoIG1vZGVsIGlkcy5cbiAgICBjaWRQcmVmaXg6ICdjJyxcblxuICAgIC8vIEluaXRpYWxpemUgaXMgYW4gZW1wdHkgZnVuY3Rpb24gYnkgZGVmYXVsdC4gT3ZlcnJpZGUgaXQgd2l0aCB5b3VyIG93blxuICAgIC8vIGluaXRpYWxpemF0aW9uIGxvZ2ljLlxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCl7fSxcblxuICAgIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG1vZGVsJ3MgYGF0dHJpYnV0ZXNgIG9iamVjdC5cbiAgICB0b0pTT046IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBfLmNsb25lKHRoaXMuYXR0cmlidXRlcyk7XG4gICAgfSxcblxuICAgIC8vIFByb3h5IGBCYWNrYm9uZS5zeW5jYCBieSBkZWZhdWx0IC0tIGJ1dCBvdmVycmlkZSB0aGlzIGlmIHlvdSBuZWVkXG4gICAgLy8gY3VzdG9tIHN5bmNpbmcgc2VtYW50aWNzIGZvciAqdGhpcyogcGFydGljdWxhciBtb2RlbC5cbiAgICBzeW5jOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBCYWNrYm9uZS5zeW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8vIEdldCB0aGUgdmFsdWUgb2YgYW4gYXR0cmlidXRlLlxuICAgIGdldDogZnVuY3Rpb24oYXR0cikge1xuICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlc1thdHRyXTtcbiAgICB9LFxuXG4gICAgLy8gR2V0IHRoZSBIVE1MLWVzY2FwZWQgdmFsdWUgb2YgYW4gYXR0cmlidXRlLlxuICAgIGVzY2FwZTogZnVuY3Rpb24oYXR0cikge1xuICAgICAgcmV0dXJuIF8uZXNjYXBlKHRoaXMuZ2V0KGF0dHIpKTtcbiAgICB9LFxuXG4gICAgLy8gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGF0dHJpYnV0ZSBjb250YWlucyBhIHZhbHVlIHRoYXQgaXMgbm90IG51bGxcbiAgICAvLyBvciB1bmRlZmluZWQuXG4gICAgaGFzOiBmdW5jdGlvbihhdHRyKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXQoYXR0cikgIT0gbnVsbDtcbiAgICB9LFxuXG4gICAgLy8gU3BlY2lhbC1jYXNlZCBwcm94eSB0byB1bmRlcnNjb3JlJ3MgYF8ubWF0Y2hlc2AgbWV0aG9kLlxuICAgIG1hdGNoZXM6IGZ1bmN0aW9uKGF0dHJzKSB7XG4gICAgICByZXR1cm4gISFfLml0ZXJhdGVlKGF0dHJzLCB0aGlzKSh0aGlzLmF0dHJpYnV0ZXMpO1xuICAgIH0sXG5cbiAgICAvLyBTZXQgYSBoYXNoIG9mIG1vZGVsIGF0dHJpYnV0ZXMgb24gdGhlIG9iamVjdCwgZmlyaW5nIGBcImNoYW5nZVwiYC4gVGhpcyBpc1xuICAgIC8vIHRoZSBjb3JlIHByaW1pdGl2ZSBvcGVyYXRpb24gb2YgYSBtb2RlbCwgdXBkYXRpbmcgdGhlIGRhdGEgYW5kIG5vdGlmeWluZ1xuICAgIC8vIGFueW9uZSB3aG8gbmVlZHMgdG8ga25vdyBhYm91dCB0aGUgY2hhbmdlIGluIHN0YXRlLiBUaGUgaGVhcnQgb2YgdGhlIGJlYXN0LlxuICAgIHNldDogZnVuY3Rpb24oa2V5LCB2YWwsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChrZXkgPT0gbnVsbCkgcmV0dXJuIHRoaXM7XG5cbiAgICAgIC8vIEhhbmRsZSBib3RoIGBcImtleVwiLCB2YWx1ZWAgYW5kIGB7a2V5OiB2YWx1ZX1gIC1zdHlsZSBhcmd1bWVudHMuXG4gICAgICB2YXIgYXR0cnM7XG4gICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgYXR0cnMgPSBrZXk7XG4gICAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbDtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAgICAgLy8gUnVuIHZhbGlkYXRpb24uXG4gICAgICBpZiAoIXRoaXMuX3ZhbGlkYXRlKGF0dHJzLCBvcHRpb25zKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAvLyBFeHRyYWN0IGF0dHJpYnV0ZXMgYW5kIG9wdGlvbnMuXG4gICAgICB2YXIgdW5zZXQgICAgICA9IG9wdGlvbnMudW5zZXQ7XG4gICAgICB2YXIgc2lsZW50ICAgICA9IG9wdGlvbnMuc2lsZW50O1xuICAgICAgdmFyIGNoYW5nZXMgICAgPSBbXTtcbiAgICAgIHZhciBjaGFuZ2luZyAgID0gdGhpcy5fY2hhbmdpbmc7XG4gICAgICB0aGlzLl9jaGFuZ2luZyA9IHRydWU7XG5cbiAgICAgIGlmICghY2hhbmdpbmcpIHtcbiAgICAgICAgdGhpcy5fcHJldmlvdXNBdHRyaWJ1dGVzID0gXy5jbG9uZSh0aGlzLmF0dHJpYnV0ZXMpO1xuICAgICAgICB0aGlzLmNoYW5nZWQgPSB7fTtcbiAgICAgIH1cblxuICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLmF0dHJpYnV0ZXM7XG4gICAgICB2YXIgY2hhbmdlZCA9IHRoaXMuY2hhbmdlZDtcbiAgICAgIHZhciBwcmV2ICAgID0gdGhpcy5fcHJldmlvdXNBdHRyaWJ1dGVzO1xuXG4gICAgICAvLyBGb3IgZWFjaCBgc2V0YCBhdHRyaWJ1dGUsIHVwZGF0ZSBvciBkZWxldGUgdGhlIGN1cnJlbnQgdmFsdWUuXG4gICAgICBmb3IgKHZhciBhdHRyIGluIGF0dHJzKSB7XG4gICAgICAgIHZhbCA9IGF0dHJzW2F0dHJdO1xuICAgICAgICBpZiAoIV8uaXNFcXVhbChjdXJyZW50W2F0dHJdLCB2YWwpKSBjaGFuZ2VzLnB1c2goYXR0cik7XG4gICAgICAgIGlmICghXy5pc0VxdWFsKHByZXZbYXR0cl0sIHZhbCkpIHtcbiAgICAgICAgICBjaGFuZ2VkW2F0dHJdID0gdmFsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSBjaGFuZ2VkW2F0dHJdO1xuICAgICAgICB9XG4gICAgICAgIHVuc2V0ID8gZGVsZXRlIGN1cnJlbnRbYXR0cl0gOiBjdXJyZW50W2F0dHJdID0gdmFsO1xuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgdGhlIGBpZGAuXG4gICAgICB0aGlzLmlkID0gdGhpcy5nZXQodGhpcy5pZEF0dHJpYnV0ZSk7XG5cbiAgICAgIC8vIFRyaWdnZXIgYWxsIHJlbGV2YW50IGF0dHJpYnV0ZSBjaGFuZ2VzLlxuICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgaWYgKGNoYW5nZXMubGVuZ3RoKSB0aGlzLl9wZW5kaW5nID0gb3B0aW9ucztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2U6JyArIGNoYW5nZXNbaV0sIHRoaXMsIGN1cnJlbnRbY2hhbmdlc1tpXV0sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFlvdSBtaWdodCBiZSB3b25kZXJpbmcgd2h5IHRoZXJlJ3MgYSBgd2hpbGVgIGxvb3AgaGVyZS4gQ2hhbmdlcyBjYW5cbiAgICAgIC8vIGJlIHJlY3Vyc2l2ZWx5IG5lc3RlZCB3aXRoaW4gYFwiY2hhbmdlXCJgIGV2ZW50cy5cbiAgICAgIGlmIChjaGFuZ2luZykgcmV0dXJuIHRoaXM7XG4gICAgICBpZiAoIXNpbGVudCkge1xuICAgICAgICB3aGlsZSAodGhpcy5fcGVuZGluZykge1xuICAgICAgICAgIG9wdGlvbnMgPSB0aGlzLl9wZW5kaW5nO1xuICAgICAgICAgIHRoaXMuX3BlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2NoYW5nZScsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9wZW5kaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLl9jaGFuZ2luZyA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFJlbW92ZSBhbiBhdHRyaWJ1dGUgZnJvbSB0aGUgbW9kZWwsIGZpcmluZyBgXCJjaGFuZ2VcImAuIGB1bnNldGAgaXMgYSBub29wXG4gICAgLy8gaWYgdGhlIGF0dHJpYnV0ZSBkb2Vzbid0IGV4aXN0LlxuICAgIHVuc2V0OiBmdW5jdGlvbihhdHRyLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXQoYXR0ciwgdm9pZCAwLCBfLmV4dGVuZCh7fSwgb3B0aW9ucywge3Vuc2V0OiB0cnVlfSkpO1xuICAgIH0sXG5cbiAgICAvLyBDbGVhciBhbGwgYXR0cmlidXRlcyBvbiB0aGUgbW9kZWwsIGZpcmluZyBgXCJjaGFuZ2VcImAuXG4gICAgY2xlYXI6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHZhciBhdHRycyA9IHt9O1xuICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuYXR0cmlidXRlcykgYXR0cnNba2V5XSA9IHZvaWQgMDtcbiAgICAgIHJldHVybiB0aGlzLnNldChhdHRycywgXy5leHRlbmQoe30sIG9wdGlvbnMsIHt1bnNldDogdHJ1ZX0pKTtcbiAgICB9LFxuXG4gICAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBtb2RlbCBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBgXCJjaGFuZ2VcImAgZXZlbnQuXG4gICAgLy8gSWYgeW91IHNwZWNpZnkgYW4gYXR0cmlidXRlIG5hbWUsIGRldGVybWluZSBpZiB0aGF0IGF0dHJpYnV0ZSBoYXMgY2hhbmdlZC5cbiAgICBoYXNDaGFuZ2VkOiBmdW5jdGlvbihhdHRyKSB7XG4gICAgICBpZiAoYXR0ciA9PSBudWxsKSByZXR1cm4gIV8uaXNFbXB0eSh0aGlzLmNoYW5nZWQpO1xuICAgICAgcmV0dXJuIF8uaGFzKHRoaXMuY2hhbmdlZCwgYXR0cik7XG4gICAgfSxcblxuICAgIC8vIFJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBhbGwgdGhlIGF0dHJpYnV0ZXMgdGhhdCBoYXZlIGNoYW5nZWQsIG9yXG4gICAgLy8gZmFsc2UgaWYgdGhlcmUgYXJlIG5vIGNoYW5nZWQgYXR0cmlidXRlcy4gVXNlZnVsIGZvciBkZXRlcm1pbmluZyB3aGF0XG4gICAgLy8gcGFydHMgb2YgYSB2aWV3IG5lZWQgdG8gYmUgdXBkYXRlZCBhbmQvb3Igd2hhdCBhdHRyaWJ1dGVzIG5lZWQgdG8gYmVcbiAgICAvLyBwZXJzaXN0ZWQgdG8gdGhlIHNlcnZlci4gVW5zZXQgYXR0cmlidXRlcyB3aWxsIGJlIHNldCB0byB1bmRlZmluZWQuXG4gICAgLy8gWW91IGNhbiBhbHNvIHBhc3MgYW4gYXR0cmlidXRlcyBvYmplY3QgdG8gZGlmZiBhZ2FpbnN0IHRoZSBtb2RlbCxcbiAgICAvLyBkZXRlcm1pbmluZyBpZiB0aGVyZSAqd291bGQgYmUqIGEgY2hhbmdlLlxuICAgIGNoYW5nZWRBdHRyaWJ1dGVzOiBmdW5jdGlvbihkaWZmKSB7XG4gICAgICBpZiAoIWRpZmYpIHJldHVybiB0aGlzLmhhc0NoYW5nZWQoKSA/IF8uY2xvbmUodGhpcy5jaGFuZ2VkKSA6IGZhbHNlO1xuICAgICAgdmFyIG9sZCA9IHRoaXMuX2NoYW5naW5nID8gdGhpcy5fcHJldmlvdXNBdHRyaWJ1dGVzIDogdGhpcy5hdHRyaWJ1dGVzO1xuICAgICAgdmFyIGNoYW5nZWQgPSB7fTtcbiAgICAgIGZvciAodmFyIGF0dHIgaW4gZGlmZikge1xuICAgICAgICB2YXIgdmFsID0gZGlmZlthdHRyXTtcbiAgICAgICAgaWYgKF8uaXNFcXVhbChvbGRbYXR0cl0sIHZhbCkpIGNvbnRpbnVlO1xuICAgICAgICBjaGFuZ2VkW2F0dHJdID0gdmFsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF8uc2l6ZShjaGFuZ2VkKSA/IGNoYW5nZWQgOiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gR2V0IHRoZSBwcmV2aW91cyB2YWx1ZSBvZiBhbiBhdHRyaWJ1dGUsIHJlY29yZGVkIGF0IHRoZSB0aW1lIHRoZSBsYXN0XG4gICAgLy8gYFwiY2hhbmdlXCJgIGV2ZW50IHdhcyBmaXJlZC5cbiAgICBwcmV2aW91czogZnVuY3Rpb24oYXR0cikge1xuICAgICAgaWYgKGF0dHIgPT0gbnVsbCB8fCAhdGhpcy5fcHJldmlvdXNBdHRyaWJ1dGVzKSByZXR1cm4gbnVsbDtcbiAgICAgIHJldHVybiB0aGlzLl9wcmV2aW91c0F0dHJpYnV0ZXNbYXR0cl07XG4gICAgfSxcblxuICAgIC8vIEdldCBhbGwgb2YgdGhlIGF0dHJpYnV0ZXMgb2YgdGhlIG1vZGVsIGF0IHRoZSB0aW1lIG9mIHRoZSBwcmV2aW91c1xuICAgIC8vIGBcImNoYW5nZVwiYCBldmVudC5cbiAgICBwcmV2aW91c0F0dHJpYnV0ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF8uY2xvbmUodGhpcy5fcHJldmlvdXNBdHRyaWJ1dGVzKTtcbiAgICB9LFxuXG4gICAgLy8gRmV0Y2ggdGhlIG1vZGVsIGZyb20gdGhlIHNlcnZlciwgbWVyZ2luZyB0aGUgcmVzcG9uc2Ugd2l0aCB0aGUgbW9kZWwnc1xuICAgIC8vIGxvY2FsIGF0dHJpYnV0ZXMuIEFueSBjaGFuZ2VkIGF0dHJpYnV0ZXMgd2lsbCB0cmlnZ2VyIGEgXCJjaGFuZ2VcIiBldmVudC5cbiAgICBmZXRjaDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IF8uZXh0ZW5kKHtwYXJzZTogdHJ1ZX0sIG9wdGlvbnMpO1xuICAgICAgdmFyIG1vZGVsID0gdGhpcztcbiAgICAgIHZhciBzdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzO1xuICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICB2YXIgc2VydmVyQXR0cnMgPSBvcHRpb25zLnBhcnNlID8gbW9kZWwucGFyc2UocmVzcCwgb3B0aW9ucykgOiByZXNwO1xuICAgICAgICBpZiAoIW1vZGVsLnNldChzZXJ2ZXJBdHRycywgb3B0aW9ucykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKHN1Y2Nlc3MpIHN1Y2Nlc3MuY2FsbChvcHRpb25zLmNvbnRleHQsIG1vZGVsLCByZXNwLCBvcHRpb25zKTtcbiAgICAgICAgbW9kZWwudHJpZ2dlcignc3luYycsIG1vZGVsLCByZXNwLCBvcHRpb25zKTtcbiAgICAgIH07XG4gICAgICB3cmFwRXJyb3IodGhpcywgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gdGhpcy5zeW5jKCdyZWFkJywgdGhpcywgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8vIFNldCBhIGhhc2ggb2YgbW9kZWwgYXR0cmlidXRlcywgYW5kIHN5bmMgdGhlIG1vZGVsIHRvIHRoZSBzZXJ2ZXIuXG4gICAgLy8gSWYgdGhlIHNlcnZlciByZXR1cm5zIGFuIGF0dHJpYnV0ZXMgaGFzaCB0aGF0IGRpZmZlcnMsIHRoZSBtb2RlbCdzXG4gICAgLy8gc3RhdGUgd2lsbCBiZSBgc2V0YCBhZ2Fpbi5cbiAgICBzYXZlOiBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucykge1xuICAgICAgLy8gSGFuZGxlIGJvdGggYFwia2V5XCIsIHZhbHVlYCBhbmQgYHtrZXk6IHZhbHVlfWAgLXN0eWxlIGFyZ3VtZW50cy5cbiAgICAgIHZhciBhdHRycztcbiAgICAgIGlmIChrZXkgPT0gbnVsbCB8fCB0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgICBhdHRycyA9IGtleTtcbiAgICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChhdHRycyA9IHt9KVtrZXldID0gdmFsO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zID0gXy5leHRlbmQoe3ZhbGlkYXRlOiB0cnVlLCBwYXJzZTogdHJ1ZX0sIG9wdGlvbnMpO1xuICAgICAgdmFyIHdhaXQgPSBvcHRpb25zLndhaXQ7XG5cbiAgICAgIC8vIElmIHdlJ3JlIG5vdCB3YWl0aW5nIGFuZCBhdHRyaWJ1dGVzIGV4aXN0LCBzYXZlIGFjdHMgYXNcbiAgICAgIC8vIGBzZXQoYXR0cikuc2F2ZShudWxsLCBvcHRzKWAgd2l0aCB2YWxpZGF0aW9uLiBPdGhlcndpc2UsIGNoZWNrIGlmXG4gICAgICAvLyB0aGUgbW9kZWwgd2lsbCBiZSB2YWxpZCB3aGVuIHRoZSBhdHRyaWJ1dGVzLCBpZiBhbnksIGFyZSBzZXQuXG4gICAgICBpZiAoYXR0cnMgJiYgIXdhaXQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnNldChhdHRycywgb3B0aW9ucykpIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdGhpcy5fdmFsaWRhdGUoYXR0cnMsIG9wdGlvbnMpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIEFmdGVyIGEgc3VjY2Vzc2Z1bCBzZXJ2ZXItc2lkZSBzYXZlLCB0aGUgY2xpZW50IGlzIChvcHRpb25hbGx5KVxuICAgICAgLy8gdXBkYXRlZCB3aXRoIHRoZSBzZXJ2ZXItc2lkZSBzdGF0ZS5cbiAgICAgIHZhciBtb2RlbCA9IHRoaXM7XG4gICAgICB2YXIgc3VjY2VzcyA9IG9wdGlvbnMuc3VjY2VzcztcbiAgICAgIHZhciBhdHRyaWJ1dGVzID0gdGhpcy5hdHRyaWJ1dGVzO1xuICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAvLyBFbnN1cmUgYXR0cmlidXRlcyBhcmUgcmVzdG9yZWQgZHVyaW5nIHN5bmNocm9ub3VzIHNhdmVzLlxuICAgICAgICBtb2RlbC5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcbiAgICAgICAgdmFyIHNlcnZlckF0dHJzID0gb3B0aW9ucy5wYXJzZSA/IG1vZGVsLnBhcnNlKHJlc3AsIG9wdGlvbnMpIDogcmVzcDtcbiAgICAgICAgaWYgKHdhaXQpIHNlcnZlckF0dHJzID0gXy5leHRlbmQoe30sIGF0dHJzLCBzZXJ2ZXJBdHRycyk7XG4gICAgICAgIGlmIChzZXJ2ZXJBdHRycyAmJiAhbW9kZWwuc2V0KHNlcnZlckF0dHJzLCBvcHRpb25zKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2Vzcy5jYWxsKG9wdGlvbnMuY29udGV4dCwgbW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgICBtb2RlbC50cmlnZ2VyKCdzeW5jJywgbW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgfTtcbiAgICAgIHdyYXBFcnJvcih0aGlzLCBvcHRpb25zKTtcblxuICAgICAgLy8gU2V0IHRlbXBvcmFyeSBhdHRyaWJ1dGVzIGlmIGB7d2FpdDogdHJ1ZX1gIHRvIHByb3Blcmx5IGZpbmQgbmV3IGlkcy5cbiAgICAgIGlmIChhdHRycyAmJiB3YWl0KSB0aGlzLmF0dHJpYnV0ZXMgPSBfLmV4dGVuZCh7fSwgYXR0cmlidXRlcywgYXR0cnMpO1xuXG4gICAgICB2YXIgbWV0aG9kID0gdGhpcy5pc05ldygpID8gJ2NyZWF0ZScgOiAob3B0aW9ucy5wYXRjaCA/ICdwYXRjaCcgOiAndXBkYXRlJyk7XG4gICAgICBpZiAobWV0aG9kID09PSAncGF0Y2gnICYmICFvcHRpb25zLmF0dHJzKSBvcHRpb25zLmF0dHJzID0gYXR0cnM7XG4gICAgICB2YXIgeGhyID0gdGhpcy5zeW5jKG1ldGhvZCwgdGhpcywgb3B0aW9ucyk7XG5cbiAgICAgIC8vIFJlc3RvcmUgYXR0cmlidXRlcy5cbiAgICAgIHRoaXMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG5cbiAgICAgIHJldHVybiB4aHI7XG4gICAgfSxcblxuICAgIC8vIERlc3Ryb3kgdGhpcyBtb2RlbCBvbiB0aGUgc2VydmVyIGlmIGl0IHdhcyBhbHJlYWR5IHBlcnNpc3RlZC5cbiAgICAvLyBPcHRpbWlzdGljYWxseSByZW1vdmVzIHRoZSBtb2RlbCBmcm9tIGl0cyBjb2xsZWN0aW9uLCBpZiBpdCBoYXMgb25lLlxuICAgIC8vIElmIGB3YWl0OiB0cnVlYCBpcyBwYXNzZWQsIHdhaXRzIGZvciB0aGUgc2VydmVyIHRvIHJlc3BvbmQgYmVmb3JlIHJlbW92YWwuXG4gICAgZGVzdHJveTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgPyBfLmNsb25lKG9wdGlvbnMpIDoge307XG4gICAgICB2YXIgbW9kZWwgPSB0aGlzO1xuICAgICAgdmFyIHN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3M7XG4gICAgICB2YXIgd2FpdCA9IG9wdGlvbnMud2FpdDtcblxuICAgICAgdmFyIGRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgbW9kZWwuc3RvcExpc3RlbmluZygpO1xuICAgICAgICBtb2RlbC50cmlnZ2VyKCdkZXN0cm95JywgbW9kZWwsIG1vZGVsLmNvbGxlY3Rpb24sIG9wdGlvbnMpO1xuICAgICAgfTtcblxuICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICBpZiAod2FpdCkgZGVzdHJveSgpO1xuICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2Vzcy5jYWxsKG9wdGlvbnMuY29udGV4dCwgbW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgICBpZiAoIW1vZGVsLmlzTmV3KCkpIG1vZGVsLnRyaWdnZXIoJ3N5bmMnLCBtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgeGhyID0gZmFsc2U7XG4gICAgICBpZiAodGhpcy5pc05ldygpKSB7XG4gICAgICAgIF8uZGVmZXIob3B0aW9ucy5zdWNjZXNzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdyYXBFcnJvcih0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgeGhyID0gdGhpcy5zeW5jKCdkZWxldGUnLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGlmICghd2FpdCkgZGVzdHJveSgpO1xuICAgICAgcmV0dXJuIHhocjtcbiAgICB9LFxuXG4gICAgLy8gRGVmYXVsdCBVUkwgZm9yIHRoZSBtb2RlbCdzIHJlcHJlc2VudGF0aW9uIG9uIHRoZSBzZXJ2ZXIgLS0gaWYgeW91J3JlXG4gICAgLy8gdXNpbmcgQmFja2JvbmUncyByZXN0ZnVsIG1ldGhvZHMsIG92ZXJyaWRlIHRoaXMgdG8gY2hhbmdlIHRoZSBlbmRwb2ludFxuICAgIC8vIHRoYXQgd2lsbCBiZSBjYWxsZWQuXG4gICAgdXJsOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBiYXNlID1cbiAgICAgICAgXy5yZXN1bHQodGhpcywgJ3VybFJvb3QnKSB8fFxuICAgICAgICBfLnJlc3VsdCh0aGlzLmNvbGxlY3Rpb24sICd1cmwnKSB8fFxuICAgICAgICB1cmxFcnJvcigpO1xuICAgICAgaWYgKHRoaXMuaXNOZXcoKSkgcmV0dXJuIGJhc2U7XG4gICAgICB2YXIgaWQgPSB0aGlzLmdldCh0aGlzLmlkQXR0cmlidXRlKTtcbiAgICAgIHJldHVybiBiYXNlLnJlcGxhY2UoL1teXFwvXSQvLCAnJCYvJykgKyBlbmNvZGVVUklDb21wb25lbnQoaWQpO1xuICAgIH0sXG5cbiAgICAvLyAqKnBhcnNlKiogY29udmVydHMgYSByZXNwb25zZSBpbnRvIHRoZSBoYXNoIG9mIGF0dHJpYnV0ZXMgdG8gYmUgYHNldGAgb25cbiAgICAvLyB0aGUgbW9kZWwuIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIGlzIGp1c3QgdG8gcGFzcyB0aGUgcmVzcG9uc2UgYWxvbmcuXG4gICAgcGFyc2U6IGZ1bmN0aW9uKHJlc3AsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiByZXNwO1xuICAgIH0sXG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgbW9kZWwgd2l0aCBpZGVudGljYWwgYXR0cmlidXRlcyB0byB0aGlzIG9uZS5cbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IodGhpcy5hdHRyaWJ1dGVzKTtcbiAgICB9LFxuXG4gICAgLy8gQSBtb2RlbCBpcyBuZXcgaWYgaXQgaGFzIG5ldmVyIGJlZW4gc2F2ZWQgdG8gdGhlIHNlcnZlciwgYW5kIGxhY2tzIGFuIGlkLlxuICAgIGlzTmV3OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhdGhpcy5oYXModGhpcy5pZEF0dHJpYnV0ZSk7XG4gICAgfSxcblxuICAgIC8vIENoZWNrIGlmIHRoZSBtb2RlbCBpcyBjdXJyZW50bHkgaW4gYSB2YWxpZCBzdGF0ZS5cbiAgICBpc1ZhbGlkOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdmFsaWRhdGUoe30sIF8uZGVmYXVsdHMoe3ZhbGlkYXRlOiB0cnVlfSwgb3B0aW9ucykpO1xuICAgIH0sXG5cbiAgICAvLyBSdW4gdmFsaWRhdGlvbiBhZ2FpbnN0IHRoZSBuZXh0IGNvbXBsZXRlIHNldCBvZiBtb2RlbCBhdHRyaWJ1dGVzLFxuICAgIC8vIHJldHVybmluZyBgdHJ1ZWAgaWYgYWxsIGlzIHdlbGwuIE90aGVyd2lzZSwgZmlyZSBhbiBgXCJpbnZhbGlkXCJgIGV2ZW50LlxuICAgIF92YWxpZGF0ZTogZnVuY3Rpb24oYXR0cnMsIG9wdGlvbnMpIHtcbiAgICAgIGlmICghb3B0aW9ucy52YWxpZGF0ZSB8fCAhdGhpcy52YWxpZGF0ZSkgcmV0dXJuIHRydWU7XG4gICAgICBhdHRycyA9IF8uZXh0ZW5kKHt9LCB0aGlzLmF0dHJpYnV0ZXMsIGF0dHJzKTtcbiAgICAgIHZhciBlcnJvciA9IHRoaXMudmFsaWRhdGlvbkVycm9yID0gdGhpcy52YWxpZGF0ZShhdHRycywgb3B0aW9ucykgfHwgbnVsbDtcbiAgICAgIGlmICghZXJyb3IpIHJldHVybiB0cnVlO1xuICAgICAgdGhpcy50cmlnZ2VyKCdpbnZhbGlkJywgdGhpcywgZXJyb3IsIF8uZXh0ZW5kKG9wdGlvbnMsIHt2YWxpZGF0aW9uRXJyb3I6IGVycm9yfSkpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICB9KTtcblxuICAvLyBVbmRlcnNjb3JlIG1ldGhvZHMgdGhhdCB3ZSB3YW50IHRvIGltcGxlbWVudCBvbiB0aGUgTW9kZWwsIG1hcHBlZCB0byB0aGVcbiAgLy8gbnVtYmVyIG9mIGFyZ3VtZW50cyB0aGV5IHRha2UuXG4gIHZhciBtb2RlbE1ldGhvZHMgPSB7IGtleXM6IDEsIHZhbHVlczogMSwgcGFpcnM6IDEsIGludmVydDogMSwgcGljazogMCxcbiAgICAgIG9taXQ6IDAsIGNoYWluOiAxLCBpc0VtcHR5OiAxIH07XG5cbiAgLy8gTWl4IGluIGVhY2ggVW5kZXJzY29yZSBtZXRob2QgYXMgYSBwcm94eSB0byBgTW9kZWwjYXR0cmlidXRlc2AuXG4gIGFkZFVuZGVyc2NvcmVNZXRob2RzKE1vZGVsLCBtb2RlbE1ldGhvZHMsICdhdHRyaWJ1dGVzJyk7XG5cbiAgLy8gQmFja2JvbmUuQ29sbGVjdGlvblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gSWYgbW9kZWxzIHRlbmQgdG8gcmVwcmVzZW50IGEgc2luZ2xlIHJvdyBvZiBkYXRhLCBhIEJhY2tib25lIENvbGxlY3Rpb24gaXNcbiAgLy8gbW9yZSBhbmFsb2dvdXMgdG8gYSB0YWJsZSBmdWxsIG9mIGRhdGEgLi4uIG9yIGEgc21hbGwgc2xpY2Ugb3IgcGFnZSBvZiB0aGF0XG4gIC8vIHRhYmxlLCBvciBhIGNvbGxlY3Rpb24gb2Ygcm93cyB0aGF0IGJlbG9uZyB0b2dldGhlciBmb3IgYSBwYXJ0aWN1bGFyIHJlYXNvblxuICAvLyAtLSBhbGwgb2YgdGhlIG1lc3NhZ2VzIGluIHRoaXMgcGFydGljdWxhciBmb2xkZXIsIGFsbCBvZiB0aGUgZG9jdW1lbnRzXG4gIC8vIGJlbG9uZ2luZyB0byB0aGlzIHBhcnRpY3VsYXIgYXV0aG9yLCBhbmQgc28gb24uIENvbGxlY3Rpb25zIG1haW50YWluXG4gIC8vIGluZGV4ZXMgb2YgdGhlaXIgbW9kZWxzLCBib3RoIGluIG9yZGVyLCBhbmQgZm9yIGxvb2t1cCBieSBgaWRgLlxuXG4gIC8vIENyZWF0ZSBhIG5ldyAqKkNvbGxlY3Rpb24qKiwgcGVyaGFwcyB0byBjb250YWluIGEgc3BlY2lmaWMgdHlwZSBvZiBgbW9kZWxgLlxuICAvLyBJZiBhIGBjb21wYXJhdG9yYCBpcyBzcGVjaWZpZWQsIHRoZSBDb2xsZWN0aW9uIHdpbGwgbWFpbnRhaW5cbiAgLy8gaXRzIG1vZGVscyBpbiBzb3J0IG9yZGVyLCBhcyB0aGV5J3JlIGFkZGVkIGFuZCByZW1vdmVkLlxuICB2YXIgQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24gPSBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIGlmIChvcHRpb25zLm1vZGVsKSB0aGlzLm1vZGVsID0gb3B0aW9ucy5tb2RlbDtcbiAgICBpZiAob3B0aW9ucy5jb21wYXJhdG9yICE9PSB2b2lkIDApIHRoaXMuY29tcGFyYXRvciA9IG9wdGlvbnMuY29tcGFyYXRvcjtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChtb2RlbHMpIHRoaXMucmVzZXQobW9kZWxzLCBfLmV4dGVuZCh7c2lsZW50OiB0cnVlfSwgb3B0aW9ucykpO1xuICB9O1xuXG4gIC8vIERlZmF1bHQgb3B0aW9ucyBmb3IgYENvbGxlY3Rpb24jc2V0YC5cbiAgdmFyIHNldE9wdGlvbnMgPSB7YWRkOiB0cnVlLCByZW1vdmU6IHRydWUsIG1lcmdlOiB0cnVlfTtcbiAgdmFyIGFkZE9wdGlvbnMgPSB7YWRkOiB0cnVlLCByZW1vdmU6IGZhbHNlfTtcblxuICAvLyBTcGxpY2VzIGBpbnNlcnRgIGludG8gYGFycmF5YCBhdCBpbmRleCBgYXRgLlxuICB2YXIgc3BsaWNlID0gZnVuY3Rpb24oYXJyYXksIGluc2VydCwgYXQpIHtcbiAgICBhdCA9IE1hdGgubWluKE1hdGgubWF4KGF0LCAwKSwgYXJyYXkubGVuZ3RoKTtcbiAgICB2YXIgdGFpbCA9IEFycmF5KGFycmF5Lmxlbmd0aCAtIGF0KTtcbiAgICB2YXIgbGVuZ3RoID0gaW5zZXJ0Lmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRhaWwubGVuZ3RoOyBpKyspIHRhaWxbaV0gPSBhcnJheVtpICsgYXRdO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykgYXJyYXlbaSArIGF0XSA9IGluc2VydFtpXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGFpbC5sZW5ndGg7IGkrKykgYXJyYXlbaSArIGxlbmd0aCArIGF0XSA9IHRhaWxbaV07XG4gIH07XG5cbiAgLy8gRGVmaW5lIHRoZSBDb2xsZWN0aW9uJ3MgaW5oZXJpdGFibGUgbWV0aG9kcy5cbiAgXy5leHRlbmQoQ29sbGVjdGlvbi5wcm90b3R5cGUsIEV2ZW50cywge1xuXG4gICAgLy8gVGhlIGRlZmF1bHQgbW9kZWwgZm9yIGEgY29sbGVjdGlvbiBpcyBqdXN0IGEgKipCYWNrYm9uZS5Nb2RlbCoqLlxuICAgIC8vIFRoaXMgc2hvdWxkIGJlIG92ZXJyaWRkZW4gaW4gbW9zdCBjYXNlcy5cbiAgICBtb2RlbDogTW9kZWwsXG5cbiAgICAvLyBJbml0aWFsaXplIGlzIGFuIGVtcHR5IGZ1bmN0aW9uIGJ5IGRlZmF1bHQuIE92ZXJyaWRlIGl0IHdpdGggeW91ciBvd25cbiAgICAvLyBpbml0aWFsaXphdGlvbiBsb2dpYy5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpe30sXG5cbiAgICAvLyBUaGUgSlNPTiByZXByZXNlbnRhdGlvbiBvZiBhIENvbGxlY3Rpb24gaXMgYW4gYXJyYXkgb2YgdGhlXG4gICAgLy8gbW9kZWxzJyBhdHRyaWJ1dGVzLlxuICAgIHRvSlNPTjogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uKG1vZGVsKSB7IHJldHVybiBtb2RlbC50b0pTT04ob3B0aW9ucyk7IH0pO1xuICAgIH0sXG5cbiAgICAvLyBQcm94eSBgQmFja2JvbmUuc3luY2AgYnkgZGVmYXVsdC5cbiAgICBzeW5jOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBCYWNrYm9uZS5zeW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8vIEFkZCBhIG1vZGVsLCBvciBsaXN0IG9mIG1vZGVscyB0byB0aGUgc2V0LiBgbW9kZWxzYCBtYXkgYmUgQmFja2JvbmVcbiAgICAvLyBNb2RlbHMgb3IgcmF3IEphdmFTY3JpcHQgb2JqZWN0cyB0byBiZSBjb252ZXJ0ZWQgdG8gTW9kZWxzLCBvciBhbnlcbiAgICAvLyBjb21iaW5hdGlvbiBvZiB0aGUgdHdvLlxuICAgIGFkZDogZnVuY3Rpb24obW9kZWxzLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXQobW9kZWxzLCBfLmV4dGVuZCh7bWVyZ2U6IGZhbHNlfSwgb3B0aW9ucywgYWRkT3B0aW9ucykpO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgYSBtb2RlbCwgb3IgYSBsaXN0IG9mIG1vZGVscyBmcm9tIHRoZSBzZXQuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG4gICAgICB2YXIgc2luZ3VsYXIgPSAhXy5pc0FycmF5KG1vZGVscyk7XG4gICAgICBtb2RlbHMgPSBzaW5ndWxhciA/IFttb2RlbHNdIDogXy5jbG9uZShtb2RlbHMpO1xuICAgICAgdmFyIHJlbW92ZWQgPSB0aGlzLl9yZW1vdmVNb2RlbHMobW9kZWxzLCBvcHRpb25zKTtcbiAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQgJiYgcmVtb3ZlZCkgdGhpcy50cmlnZ2VyKCd1cGRhdGUnLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgIHJldHVybiBzaW5ndWxhciA/IHJlbW92ZWRbMF0gOiByZW1vdmVkO1xuICAgIH0sXG5cbiAgICAvLyBVcGRhdGUgYSBjb2xsZWN0aW9uIGJ5IGBzZXRgLWluZyBhIG5ldyBsaXN0IG9mIG1vZGVscywgYWRkaW5nIG5ldyBvbmVzLFxuICAgIC8vIHJlbW92aW5nIG1vZGVscyB0aGF0IGFyZSBubyBsb25nZXIgcHJlc2VudCwgYW5kIG1lcmdpbmcgbW9kZWxzIHRoYXRcbiAgICAvLyBhbHJlYWR5IGV4aXN0IGluIHRoZSBjb2xsZWN0aW9uLCBhcyBuZWNlc3NhcnkuIFNpbWlsYXIgdG8gKipNb2RlbCNzZXQqKixcbiAgICAvLyB0aGUgY29yZSBvcGVyYXRpb24gZm9yIHVwZGF0aW5nIHRoZSBkYXRhIGNvbnRhaW5lZCBieSB0aGUgY29sbGVjdGlvbi5cbiAgICBzZXQ6IGZ1bmN0aW9uKG1vZGVscywgb3B0aW9ucykge1xuICAgICAgaWYgKG1vZGVscyA9PSBudWxsKSByZXR1cm47XG5cbiAgICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKHt9LCBvcHRpb25zLCBzZXRPcHRpb25zKTtcbiAgICAgIGlmIChvcHRpb25zLnBhcnNlICYmICF0aGlzLl9pc01vZGVsKG1vZGVscykpIG1vZGVscyA9IHRoaXMucGFyc2UobW9kZWxzLCBvcHRpb25zKTtcblxuICAgICAgdmFyIHNpbmd1bGFyID0gIV8uaXNBcnJheShtb2RlbHMpO1xuICAgICAgbW9kZWxzID0gc2luZ3VsYXIgPyBbbW9kZWxzXSA6IG1vZGVscy5zbGljZSgpO1xuXG4gICAgICB2YXIgYXQgPSBvcHRpb25zLmF0O1xuICAgICAgaWYgKGF0ICE9IG51bGwpIGF0ID0gK2F0O1xuICAgICAgaWYgKGF0IDwgMCkgYXQgKz0gdGhpcy5sZW5ndGggKyAxO1xuXG4gICAgICB2YXIgc2V0ID0gW107XG4gICAgICB2YXIgdG9BZGQgPSBbXTtcbiAgICAgIHZhciB0b1JlbW92ZSA9IFtdO1xuICAgICAgdmFyIG1vZGVsTWFwID0ge307XG5cbiAgICAgIHZhciBhZGQgPSBvcHRpb25zLmFkZDtcbiAgICAgIHZhciBtZXJnZSA9IG9wdGlvbnMubWVyZ2U7XG4gICAgICB2YXIgcmVtb3ZlID0gb3B0aW9ucy5yZW1vdmU7XG5cbiAgICAgIHZhciBzb3J0ID0gZmFsc2U7XG4gICAgICB2YXIgc29ydGFibGUgPSB0aGlzLmNvbXBhcmF0b3IgJiYgKGF0ID09IG51bGwpICYmIG9wdGlvbnMuc29ydCAhPT0gZmFsc2U7XG4gICAgICB2YXIgc29ydEF0dHIgPSBfLmlzU3RyaW5nKHRoaXMuY29tcGFyYXRvcikgPyB0aGlzLmNvbXBhcmF0b3IgOiBudWxsO1xuXG4gICAgICAvLyBUdXJuIGJhcmUgb2JqZWN0cyBpbnRvIG1vZGVsIHJlZmVyZW5jZXMsIGFuZCBwcmV2ZW50IGludmFsaWQgbW9kZWxzXG4gICAgICAvLyBmcm9tIGJlaW5nIGFkZGVkLlxuICAgICAgdmFyIG1vZGVsO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb2RlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbW9kZWwgPSBtb2RlbHNbaV07XG5cbiAgICAgICAgLy8gSWYgYSBkdXBsaWNhdGUgaXMgZm91bmQsIHByZXZlbnQgaXQgZnJvbSBiZWluZyBhZGRlZCBhbmRcbiAgICAgICAgLy8gb3B0aW9uYWxseSBtZXJnZSBpdCBpbnRvIHRoZSBleGlzdGluZyBtb2RlbC5cbiAgICAgICAgdmFyIGV4aXN0aW5nID0gdGhpcy5nZXQobW9kZWwpO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICBpZiAobWVyZ2UgJiYgbW9kZWwgIT09IGV4aXN0aW5nKSB7XG4gICAgICAgICAgICB2YXIgYXR0cnMgPSB0aGlzLl9pc01vZGVsKG1vZGVsKSA/IG1vZGVsLmF0dHJpYnV0ZXMgOiBtb2RlbDtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBhcnNlKSBhdHRycyA9IGV4aXN0aW5nLnBhcnNlKGF0dHJzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGV4aXN0aW5nLnNldChhdHRycywgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoc29ydGFibGUgJiYgIXNvcnQpIHNvcnQgPSBleGlzdGluZy5oYXNDaGFuZ2VkKHNvcnRBdHRyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFtb2RlbE1hcFtleGlzdGluZy5jaWRdKSB7XG4gICAgICAgICAgICBtb2RlbE1hcFtleGlzdGluZy5jaWRdID0gdHJ1ZTtcbiAgICAgICAgICAgIHNldC5wdXNoKGV4aXN0aW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbW9kZWxzW2ldID0gZXhpc3Rpbmc7XG5cbiAgICAgICAgLy8gSWYgdGhpcyBpcyBhIG5ldywgdmFsaWQgbW9kZWwsIHB1c2ggaXQgdG8gdGhlIGB0b0FkZGAgbGlzdC5cbiAgICAgICAgfSBlbHNlIGlmIChhZGQpIHtcbiAgICAgICAgICBtb2RlbCA9IG1vZGVsc1tpXSA9IHRoaXMuX3ByZXBhcmVNb2RlbChtb2RlbCwgb3B0aW9ucyk7XG4gICAgICAgICAgaWYgKG1vZGVsKSB7XG4gICAgICAgICAgICB0b0FkZC5wdXNoKG1vZGVsKTtcbiAgICAgICAgICAgIHRoaXMuX2FkZFJlZmVyZW5jZShtb2RlbCwgb3B0aW9ucyk7XG4gICAgICAgICAgICBtb2RlbE1hcFttb2RlbC5jaWRdID0gdHJ1ZTtcbiAgICAgICAgICAgIHNldC5wdXNoKG1vZGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIHN0YWxlIG1vZGVscy5cbiAgICAgIGlmIChyZW1vdmUpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBtb2RlbCA9IHRoaXMubW9kZWxzW2ldO1xuICAgICAgICAgIGlmICghbW9kZWxNYXBbbW9kZWwuY2lkXSkgdG9SZW1vdmUucHVzaChtb2RlbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvUmVtb3ZlLmxlbmd0aCkgdGhpcy5fcmVtb3ZlTW9kZWxzKHRvUmVtb3ZlLCBvcHRpb25zKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2VlIGlmIHNvcnRpbmcgaXMgbmVlZGVkLCB1cGRhdGUgYGxlbmd0aGAgYW5kIHNwbGljZSBpbiBuZXcgbW9kZWxzLlxuICAgICAgdmFyIG9yZGVyQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgdmFyIHJlcGxhY2UgPSAhc29ydGFibGUgJiYgYWRkICYmIHJlbW92ZTtcbiAgICAgIGlmIChzZXQubGVuZ3RoICYmIHJlcGxhY2UpIHtcbiAgICAgICAgb3JkZXJDaGFuZ2VkID0gdGhpcy5sZW5ndGggIT0gc2V0Lmxlbmd0aCB8fCBfLnNvbWUodGhpcy5tb2RlbHMsIGZ1bmN0aW9uKG1vZGVsLCBpbmRleCkge1xuICAgICAgICAgIHJldHVybiBtb2RlbCAhPT0gc2V0W2luZGV4XTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubW9kZWxzLmxlbmd0aCA9IDA7XG4gICAgICAgIHNwbGljZSh0aGlzLm1vZGVscywgc2V0LCAwKTtcbiAgICAgICAgdGhpcy5sZW5ndGggPSB0aGlzLm1vZGVscy5sZW5ndGg7XG4gICAgICB9IGVsc2UgaWYgKHRvQWRkLmxlbmd0aCkge1xuICAgICAgICBpZiAoc29ydGFibGUpIHNvcnQgPSB0cnVlO1xuICAgICAgICBzcGxpY2UodGhpcy5tb2RlbHMsIHRvQWRkLCBhdCA9PSBudWxsID8gdGhpcy5sZW5ndGggOiBhdCk7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5tb2RlbHMubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICAvLyBTaWxlbnRseSBzb3J0IHRoZSBjb2xsZWN0aW9uIGlmIGFwcHJvcHJpYXRlLlxuICAgICAgaWYgKHNvcnQpIHRoaXMuc29ydCh7c2lsZW50OiB0cnVlfSk7XG5cbiAgICAgIC8vIFVubGVzcyBzaWxlbmNlZCwgaXQncyB0aW1lIHRvIGZpcmUgYWxsIGFwcHJvcHJpYXRlIGFkZC9zb3J0IGV2ZW50cy5cbiAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRvQWRkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGF0ICE9IG51bGwpIG9wdGlvbnMuaW5kZXggPSBhdCArIGk7XG4gICAgICAgICAgbW9kZWwgPSB0b0FkZFtpXTtcbiAgICAgICAgICBtb2RlbC50cmlnZ2VyKCdhZGQnLCBtb2RlbCwgdGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNvcnQgfHwgb3JkZXJDaGFuZ2VkKSB0aGlzLnRyaWdnZXIoJ3NvcnQnLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKHRvQWRkLmxlbmd0aCB8fCB0b1JlbW92ZS5sZW5ndGgpIHRoaXMudHJpZ2dlcigndXBkYXRlJywgdGhpcywgb3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybiB0aGUgYWRkZWQgKG9yIG1lcmdlZCkgbW9kZWwgKG9yIG1vZGVscykuXG4gICAgICByZXR1cm4gc2luZ3VsYXIgPyBtb2RlbHNbMF0gOiBtb2RlbHM7XG4gICAgfSxcblxuICAgIC8vIFdoZW4geW91IGhhdmUgbW9yZSBpdGVtcyB0aGFuIHlvdSB3YW50IHRvIGFkZCBvciByZW1vdmUgaW5kaXZpZHVhbGx5LFxuICAgIC8vIHlvdSBjYW4gcmVzZXQgdGhlIGVudGlyZSBzZXQgd2l0aCBhIG5ldyBsaXN0IG9mIG1vZGVscywgd2l0aG91dCBmaXJpbmdcbiAgICAvLyBhbnkgZ3JhbnVsYXIgYGFkZGAgb3IgYHJlbW92ZWAgZXZlbnRzLiBGaXJlcyBgcmVzZXRgIHdoZW4gZmluaXNoZWQuXG4gICAgLy8gVXNlZnVsIGZvciBidWxrIG9wZXJhdGlvbnMgYW5kIG9wdGltaXphdGlvbnMuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKG1vZGVscywgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgPyBfLmNsb25lKG9wdGlvbnMpIDoge307XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVJlZmVyZW5jZSh0aGlzLm1vZGVsc1tpXSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBvcHRpb25zLnByZXZpb3VzTW9kZWxzID0gdGhpcy5tb2RlbHM7XG4gICAgICB0aGlzLl9yZXNldCgpO1xuICAgICAgbW9kZWxzID0gdGhpcy5hZGQobW9kZWxzLCBfLmV4dGVuZCh7c2lsZW50OiB0cnVlfSwgb3B0aW9ucykpO1xuICAgICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy50cmlnZ2VyKCdyZXNldCcsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIG1vZGVscztcbiAgICB9LFxuXG4gICAgLy8gQWRkIGEgbW9kZWwgdG8gdGhlIGVuZCBvZiB0aGUgY29sbGVjdGlvbi5cbiAgICBwdXNoOiBmdW5jdGlvbihtb2RlbCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMuYWRkKG1vZGVsLCBfLmV4dGVuZCh7YXQ6IHRoaXMubGVuZ3RofSwgb3B0aW9ucykpO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgYSBtb2RlbCBmcm9tIHRoZSBlbmQgb2YgdGhlIGNvbGxlY3Rpb24uXG4gICAgcG9wOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB2YXIgbW9kZWwgPSB0aGlzLmF0KHRoaXMubGVuZ3RoIC0gMSk7XG4gICAgICByZXR1cm4gdGhpcy5yZW1vdmUobW9kZWwsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvLyBBZGQgYSBtb2RlbCB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBjb2xsZWN0aW9uLlxuICAgIHVuc2hpZnQ6IGZ1bmN0aW9uKG1vZGVsLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5hZGQobW9kZWwsIF8uZXh0ZW5kKHthdDogMH0sIG9wdGlvbnMpKTtcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIGEgbW9kZWwgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBjb2xsZWN0aW9uLlxuICAgIHNoaWZ0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB2YXIgbW9kZWwgPSB0aGlzLmF0KDApO1xuICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlKG1vZGVsLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLy8gU2xpY2Ugb3V0IGEgc3ViLWFycmF5IG9mIG1vZGVscyBmcm9tIHRoZSBjb2xsZWN0aW9uLlxuICAgIHNsaWNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBzbGljZS5hcHBseSh0aGlzLm1vZGVscywgYXJndW1lbnRzKTtcbiAgICB9LFxuXG4gICAgLy8gR2V0IGEgbW9kZWwgZnJvbSB0aGUgc2V0IGJ5IGlkLlxuICAgIGdldDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgICB2YXIgaWQgPSB0aGlzLm1vZGVsSWQodGhpcy5faXNNb2RlbChvYmopID8gb2JqLmF0dHJpYnV0ZXMgOiBvYmopO1xuICAgICAgcmV0dXJuIHRoaXMuX2J5SWRbb2JqXSB8fCB0aGlzLl9ieUlkW2lkXSB8fCB0aGlzLl9ieUlkW29iai5jaWRdO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgdGhlIG1vZGVsIGF0IHRoZSBnaXZlbiBpbmRleC5cbiAgICBhdDogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgIGlmIChpbmRleCA8IDApIGluZGV4ICs9IHRoaXMubGVuZ3RoO1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWxzW2luZGV4XTtcbiAgICB9LFxuXG4gICAgLy8gUmV0dXJuIG1vZGVscyB3aXRoIG1hdGNoaW5nIGF0dHJpYnV0ZXMuIFVzZWZ1bCBmb3Igc2ltcGxlIGNhc2VzIG9mXG4gICAgLy8gYGZpbHRlcmAuXG4gICAgd2hlcmU6IGZ1bmN0aW9uKGF0dHJzLCBmaXJzdCkge1xuICAgICAgcmV0dXJuIHRoaXNbZmlyc3QgPyAnZmluZCcgOiAnZmlsdGVyJ10oYXR0cnMpO1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm4gdGhlIGZpcnN0IG1vZGVsIHdpdGggbWF0Y2hpbmcgYXR0cmlidXRlcy4gVXNlZnVsIGZvciBzaW1wbGUgY2FzZXNcbiAgICAvLyBvZiBgZmluZGAuXG4gICAgZmluZFdoZXJlOiBmdW5jdGlvbihhdHRycykge1xuICAgICAgcmV0dXJuIHRoaXMud2hlcmUoYXR0cnMsIHRydWUpO1xuICAgIH0sXG5cbiAgICAvLyBGb3JjZSB0aGUgY29sbGVjdGlvbiB0byByZS1zb3J0IGl0c2VsZi4gWW91IGRvbid0IG5lZWQgdG8gY2FsbCB0aGlzIHVuZGVyXG4gICAgLy8gbm9ybWFsIGNpcmN1bXN0YW5jZXMsIGFzIHRoZSBzZXQgd2lsbCBtYWludGFpbiBzb3J0IG9yZGVyIGFzIGVhY2ggaXRlbVxuICAgIC8vIGlzIGFkZGVkLlxuICAgIHNvcnQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHZhciBjb21wYXJhdG9yID0gdGhpcy5jb21wYXJhdG9yO1xuICAgICAgaWYgKCFjb21wYXJhdG9yKSB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzb3J0IGEgc2V0IHdpdGhvdXQgYSBjb21wYXJhdG9yJyk7XG4gICAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgICB2YXIgbGVuZ3RoID0gY29tcGFyYXRvci5sZW5ndGg7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKGNvbXBhcmF0b3IpKSBjb21wYXJhdG9yID0gXy5iaW5kKGNvbXBhcmF0b3IsIHRoaXMpO1xuXG4gICAgICAvLyBSdW4gc29ydCBiYXNlZCBvbiB0eXBlIG9mIGBjb21wYXJhdG9yYC5cbiAgICAgIGlmIChsZW5ndGggPT09IDEgfHwgXy5pc1N0cmluZyhjb21wYXJhdG9yKSkge1xuICAgICAgICB0aGlzLm1vZGVscyA9IHRoaXMuc29ydEJ5KGNvbXBhcmF0b3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tb2RlbHMuc29ydChjb21wYXJhdG9yKTtcbiAgICAgIH1cbiAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMudHJpZ2dlcignc29ydCcsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFBsdWNrIGFuIGF0dHJpYnV0ZSBmcm9tIGVhY2ggbW9kZWwgaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgcGx1Y2s6IGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgIHJldHVybiBfLmludm9rZSh0aGlzLm1vZGVscywgJ2dldCcsIGF0dHIpO1xuICAgIH0sXG5cbiAgICAvLyBGZXRjaCB0aGUgZGVmYXVsdCBzZXQgb2YgbW9kZWxzIGZvciB0aGlzIGNvbGxlY3Rpb24sIHJlc2V0dGluZyB0aGVcbiAgICAvLyBjb2xsZWN0aW9uIHdoZW4gdGhleSBhcnJpdmUuIElmIGByZXNldDogdHJ1ZWAgaXMgcGFzc2VkLCB0aGUgcmVzcG9uc2VcbiAgICAvLyBkYXRhIHdpbGwgYmUgcGFzc2VkIHRocm91Z2ggdGhlIGByZXNldGAgbWV0aG9kIGluc3RlYWQgb2YgYHNldGAuXG4gICAgZmV0Y2g6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7cGFyc2U6IHRydWV9LCBvcHRpb25zKTtcbiAgICAgIHZhciBzdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzO1xuICAgICAgdmFyIGNvbGxlY3Rpb24gPSB0aGlzO1xuICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICB2YXIgbWV0aG9kID0gb3B0aW9ucy5yZXNldCA/ICdyZXNldCcgOiAnc2V0JztcbiAgICAgICAgY29sbGVjdGlvblttZXRob2RdKHJlc3AsIG9wdGlvbnMpO1xuICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2Vzcy5jYWxsKG9wdGlvbnMuY29udGV4dCwgY29sbGVjdGlvbiwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcignc3luYycsIGNvbGxlY3Rpb24sIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgfTtcbiAgICAgIHdyYXBFcnJvcih0aGlzLCBvcHRpb25zKTtcbiAgICAgIHJldHVybiB0aGlzLnN5bmMoJ3JlYWQnLCB0aGlzLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IGluc3RhbmNlIG9mIGEgbW9kZWwgaW4gdGhpcyBjb2xsZWN0aW9uLiBBZGQgdGhlIG1vZGVsIHRvIHRoZVxuICAgIC8vIGNvbGxlY3Rpb24gaW1tZWRpYXRlbHksIHVubGVzcyBgd2FpdDogdHJ1ZWAgaXMgcGFzc2VkLCBpbiB3aGljaCBjYXNlIHdlXG4gICAgLy8gd2FpdCBmb3IgdGhlIHNlcnZlciB0byBhZ3JlZS5cbiAgICBjcmVhdGU6IGZ1bmN0aW9uKG1vZGVsLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyA/IF8uY2xvbmUob3B0aW9ucykgOiB7fTtcbiAgICAgIHZhciB3YWl0ID0gb3B0aW9ucy53YWl0O1xuICAgICAgbW9kZWwgPSB0aGlzLl9wcmVwYXJlTW9kZWwobW9kZWwsIG9wdGlvbnMpO1xuICAgICAgaWYgKCFtb2RlbCkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKCF3YWl0KSB0aGlzLmFkZChtb2RlbCwgb3B0aW9ucyk7XG4gICAgICB2YXIgY29sbGVjdGlvbiA9IHRoaXM7XG4gICAgICB2YXIgc3VjY2VzcyA9IG9wdGlvbnMuc3VjY2VzcztcbiAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uKG1vZGVsLCByZXNwLCBjYWxsYmFja09wdHMpIHtcbiAgICAgICAgaWYgKHdhaXQpIGNvbGxlY3Rpb24uYWRkKG1vZGVsLCBjYWxsYmFja09wdHMpO1xuICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2Vzcy5jYWxsKGNhbGxiYWNrT3B0cy5jb250ZXh0LCBtb2RlbCwgcmVzcCwgY2FsbGJhY2tPcHRzKTtcbiAgICAgIH07XG4gICAgICBtb2RlbC5zYXZlKG51bGwsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIG1vZGVsO1xuICAgIH0sXG5cbiAgICAvLyAqKnBhcnNlKiogY29udmVydHMgYSByZXNwb25zZSBpbnRvIGEgbGlzdCBvZiBtb2RlbHMgdG8gYmUgYWRkZWQgdG8gdGhlXG4gICAgLy8gY29sbGVjdGlvbi4gVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gaXMganVzdCB0byBwYXNzIGl0IHRocm91Z2guXG4gICAgcGFyc2U6IGZ1bmN0aW9uKHJlc3AsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiByZXNwO1xuICAgIH0sXG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgY29sbGVjdGlvbiB3aXRoIGFuIGlkZW50aWNhbCBsaXN0IG9mIG1vZGVscyBhcyB0aGlzIG9uZS5cbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IodGhpcy5tb2RlbHMsIHtcbiAgICAgICAgbW9kZWw6IHRoaXMubW9kZWwsXG4gICAgICAgIGNvbXBhcmF0b3I6IHRoaXMuY29tcGFyYXRvclxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIERlZmluZSBob3cgdG8gdW5pcXVlbHkgaWRlbnRpZnkgbW9kZWxzIGluIHRoZSBjb2xsZWN0aW9uLlxuICAgIG1vZGVsSWQ6IGZ1bmN0aW9uIChhdHRycykge1xuICAgICAgcmV0dXJuIGF0dHJzW3RoaXMubW9kZWwucHJvdG90eXBlLmlkQXR0cmlidXRlIHx8ICdpZCddO1xuICAgIH0sXG5cbiAgICAvLyBQcml2YXRlIG1ldGhvZCB0byByZXNldCBhbGwgaW50ZXJuYWwgc3RhdGUuIENhbGxlZCB3aGVuIHRoZSBjb2xsZWN0aW9uXG4gICAgLy8gaXMgZmlyc3QgaW5pdGlhbGl6ZWQgb3IgcmVzZXQuXG4gICAgX3Jlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMubGVuZ3RoID0gMDtcbiAgICAgIHRoaXMubW9kZWxzID0gW107XG4gICAgICB0aGlzLl9ieUlkICA9IHt9O1xuICAgIH0sXG5cbiAgICAvLyBQcmVwYXJlIGEgaGFzaCBvZiBhdHRyaWJ1dGVzIChvciBvdGhlciBtb2RlbCkgdG8gYmUgYWRkZWQgdG8gdGhpc1xuICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgX3ByZXBhcmVNb2RlbDogZnVuY3Rpb24oYXR0cnMsIG9wdGlvbnMpIHtcbiAgICAgIGlmICh0aGlzLl9pc01vZGVsKGF0dHJzKSkge1xuICAgICAgICBpZiAoIWF0dHJzLmNvbGxlY3Rpb24pIGF0dHJzLmNvbGxlY3Rpb24gPSB0aGlzO1xuICAgICAgICByZXR1cm4gYXR0cnM7XG4gICAgICB9XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyA/IF8uY2xvbmUob3B0aW9ucykgOiB7fTtcbiAgICAgIG9wdGlvbnMuY29sbGVjdGlvbiA9IHRoaXM7XG4gICAgICB2YXIgbW9kZWwgPSBuZXcgdGhpcy5tb2RlbChhdHRycywgb3B0aW9ucyk7XG4gICAgICBpZiAoIW1vZGVsLnZhbGlkYXRpb25FcnJvcikgcmV0dXJuIG1vZGVsO1xuICAgICAgdGhpcy50cmlnZ2VyKCdpbnZhbGlkJywgdGhpcywgbW9kZWwudmFsaWRhdGlvbkVycm9yLCBvcHRpb25zKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gSW50ZXJuYWwgbWV0aG9kIGNhbGxlZCBieSBib3RoIHJlbW92ZSBhbmQgc2V0LlxuICAgIF9yZW1vdmVNb2RlbHM6IGZ1bmN0aW9uKG1vZGVscywgb3B0aW9ucykge1xuICAgICAgdmFyIHJlbW92ZWQgPSBbXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBtb2RlbCA9IHRoaXMuZ2V0KG1vZGVsc1tpXSk7XG4gICAgICAgIGlmICghbW9kZWwpIGNvbnRpbnVlO1xuXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuaW5kZXhPZihtb2RlbCk7XG4gICAgICAgIHRoaXMubW9kZWxzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIHRoaXMubGVuZ3RoLS07XG5cbiAgICAgICAgaWYgKCFvcHRpb25zLnNpbGVudCkge1xuICAgICAgICAgIG9wdGlvbnMuaW5kZXggPSBpbmRleDtcbiAgICAgICAgICBtb2RlbC50cmlnZ2VyKCdyZW1vdmUnLCBtb2RlbCwgdGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICByZW1vdmVkLnB1c2gobW9kZWwpO1xuICAgICAgICB0aGlzLl9yZW1vdmVSZWZlcmVuY2UobW9kZWwsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlbW92ZWQubGVuZ3RoID8gcmVtb3ZlZCA6IGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBNZXRob2QgZm9yIGNoZWNraW5nIHdoZXRoZXIgYW4gb2JqZWN0IHNob3VsZCBiZSBjb25zaWRlcmVkIGEgbW9kZWwgZm9yXG4gICAgLy8gdGhlIHB1cnBvc2VzIG9mIGFkZGluZyB0byB0aGUgY29sbGVjdGlvbi5cbiAgICBfaXNNb2RlbDogZnVuY3Rpb24gKG1vZGVsKSB7XG4gICAgICByZXR1cm4gbW9kZWwgaW5zdGFuY2VvZiBNb2RlbDtcbiAgICB9LFxuXG4gICAgLy8gSW50ZXJuYWwgbWV0aG9kIHRvIGNyZWF0ZSBhIG1vZGVsJ3MgdGllcyB0byBhIGNvbGxlY3Rpb24uXG4gICAgX2FkZFJlZmVyZW5jZTogZnVuY3Rpb24obW9kZWwsIG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuX2J5SWRbbW9kZWwuY2lkXSA9IG1vZGVsO1xuICAgICAgdmFyIGlkID0gdGhpcy5tb2RlbElkKG1vZGVsLmF0dHJpYnV0ZXMpO1xuICAgICAgaWYgKGlkICE9IG51bGwpIHRoaXMuX2J5SWRbaWRdID0gbW9kZWw7XG4gICAgICBtb2RlbC5vbignYWxsJywgdGhpcy5fb25Nb2RlbEV2ZW50LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLy8gSW50ZXJuYWwgbWV0aG9kIHRvIHNldmVyIGEgbW9kZWwncyB0aWVzIHRvIGEgY29sbGVjdGlvbi5cbiAgICBfcmVtb3ZlUmVmZXJlbmNlOiBmdW5jdGlvbihtb2RlbCwgb3B0aW9ucykge1xuICAgICAgZGVsZXRlIHRoaXMuX2J5SWRbbW9kZWwuY2lkXTtcbiAgICAgIHZhciBpZCA9IHRoaXMubW9kZWxJZChtb2RlbC5hdHRyaWJ1dGVzKTtcbiAgICAgIGlmIChpZCAhPSBudWxsKSBkZWxldGUgdGhpcy5fYnlJZFtpZF07XG4gICAgICBpZiAodGhpcyA9PT0gbW9kZWwuY29sbGVjdGlvbikgZGVsZXRlIG1vZGVsLmNvbGxlY3Rpb247XG4gICAgICBtb2RlbC5vZmYoJ2FsbCcsIHRoaXMuX29uTW9kZWxFdmVudCwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8vIEludGVybmFsIG1ldGhvZCBjYWxsZWQgZXZlcnkgdGltZSBhIG1vZGVsIGluIHRoZSBzZXQgZmlyZXMgYW4gZXZlbnQuXG4gICAgLy8gU2V0cyBuZWVkIHRvIHVwZGF0ZSB0aGVpciBpbmRleGVzIHdoZW4gbW9kZWxzIGNoYW5nZSBpZHMuIEFsbCBvdGhlclxuICAgIC8vIGV2ZW50cyBzaW1wbHkgcHJveHkgdGhyb3VnaC4gXCJhZGRcIiBhbmQgXCJyZW1vdmVcIiBldmVudHMgdGhhdCBvcmlnaW5hdGVcbiAgICAvLyBpbiBvdGhlciBjb2xsZWN0aW9ucyBhcmUgaWdub3JlZC5cbiAgICBfb25Nb2RlbEV2ZW50OiBmdW5jdGlvbihldmVudCwgbW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgIGlmICgoZXZlbnQgPT09ICdhZGQnIHx8IGV2ZW50ID09PSAncmVtb3ZlJykgJiYgY29sbGVjdGlvbiAhPT0gdGhpcykgcmV0dXJuO1xuICAgICAgaWYgKGV2ZW50ID09PSAnZGVzdHJveScpIHRoaXMucmVtb3ZlKG1vZGVsLCBvcHRpb25zKTtcbiAgICAgIGlmIChldmVudCA9PT0gJ2NoYW5nZScpIHtcbiAgICAgICAgdmFyIHByZXZJZCA9IHRoaXMubW9kZWxJZChtb2RlbC5wcmV2aW91c0F0dHJpYnV0ZXMoKSk7XG4gICAgICAgIHZhciBpZCA9IHRoaXMubW9kZWxJZChtb2RlbC5hdHRyaWJ1dGVzKTtcbiAgICAgICAgaWYgKHByZXZJZCAhPT0gaWQpIHtcbiAgICAgICAgICBpZiAocHJldklkICE9IG51bGwpIGRlbGV0ZSB0aGlzLl9ieUlkW3ByZXZJZF07XG4gICAgICAgICAgaWYgKGlkICE9IG51bGwpIHRoaXMuX2J5SWRbaWRdID0gbW9kZWw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMudHJpZ2dlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICB9KTtcblxuICAvLyBVbmRlcnNjb3JlIG1ldGhvZHMgdGhhdCB3ZSB3YW50IHRvIGltcGxlbWVudCBvbiB0aGUgQ29sbGVjdGlvbi5cbiAgLy8gOTAlIG9mIHRoZSBjb3JlIHVzZWZ1bG5lc3Mgb2YgQmFja2JvbmUgQ29sbGVjdGlvbnMgaXMgYWN0dWFsbHkgaW1wbGVtZW50ZWRcbiAgLy8gcmlnaHQgaGVyZTpcbiAgdmFyIGNvbGxlY3Rpb25NZXRob2RzID0geyBmb3JFYWNoOiAzLCBlYWNoOiAzLCBtYXA6IDMsIGNvbGxlY3Q6IDMsIHJlZHVjZTogNCxcbiAgICAgIGZvbGRsOiA0LCBpbmplY3Q6IDQsIHJlZHVjZVJpZ2h0OiA0LCBmb2xkcjogNCwgZmluZDogMywgZGV0ZWN0OiAzLCBmaWx0ZXI6IDMsXG4gICAgICBzZWxlY3Q6IDMsIHJlamVjdDogMywgZXZlcnk6IDMsIGFsbDogMywgc29tZTogMywgYW55OiAzLCBpbmNsdWRlOiAzLCBpbmNsdWRlczogMyxcbiAgICAgIGNvbnRhaW5zOiAzLCBpbnZva2U6IDAsIG1heDogMywgbWluOiAzLCB0b0FycmF5OiAxLCBzaXplOiAxLCBmaXJzdDogMyxcbiAgICAgIGhlYWQ6IDMsIHRha2U6IDMsIGluaXRpYWw6IDMsIHJlc3Q6IDMsIHRhaWw6IDMsIGRyb3A6IDMsIGxhc3Q6IDMsXG4gICAgICB3aXRob3V0OiAwLCBkaWZmZXJlbmNlOiAwLCBpbmRleE9mOiAzLCBzaHVmZmxlOiAxLCBsYXN0SW5kZXhPZjogMyxcbiAgICAgIGlzRW1wdHk6IDEsIGNoYWluOiAxLCBzYW1wbGU6IDMsIHBhcnRpdGlvbjogMywgZ3JvdXBCeTogMywgY291bnRCeTogMyxcbiAgICAgIHNvcnRCeTogMywgaW5kZXhCeTogM307XG5cbiAgLy8gTWl4IGluIGVhY2ggVW5kZXJzY29yZSBtZXRob2QgYXMgYSBwcm94eSB0byBgQ29sbGVjdGlvbiNtb2RlbHNgLlxuICBhZGRVbmRlcnNjb3JlTWV0aG9kcyhDb2xsZWN0aW9uLCBjb2xsZWN0aW9uTWV0aG9kcywgJ21vZGVscycpO1xuXG4gIC8vIEJhY2tib25lLlZpZXdcbiAgLy8gLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEJhY2tib25lIFZpZXdzIGFyZSBhbG1vc3QgbW9yZSBjb252ZW50aW9uIHRoYW4gdGhleSBhcmUgYWN0dWFsIGNvZGUuIEEgVmlld1xuICAvLyBpcyBzaW1wbHkgYSBKYXZhU2NyaXB0IG9iamVjdCB0aGF0IHJlcHJlc2VudHMgYSBsb2dpY2FsIGNodW5rIG9mIFVJIGluIHRoZVxuICAvLyBET00uIFRoaXMgbWlnaHQgYmUgYSBzaW5nbGUgaXRlbSwgYW4gZW50aXJlIGxpc3QsIGEgc2lkZWJhciBvciBwYW5lbCwgb3JcbiAgLy8gZXZlbiB0aGUgc3Vycm91bmRpbmcgZnJhbWUgd2hpY2ggd3JhcHMgeW91ciB3aG9sZSBhcHAuIERlZmluaW5nIGEgY2h1bmsgb2ZcbiAgLy8gVUkgYXMgYSAqKlZpZXcqKiBhbGxvd3MgeW91IHRvIGRlZmluZSB5b3VyIERPTSBldmVudHMgZGVjbGFyYXRpdmVseSwgd2l0aG91dFxuICAvLyBoYXZpbmcgdG8gd29ycnkgYWJvdXQgcmVuZGVyIG9yZGVyIC4uLiBhbmQgbWFrZXMgaXQgZWFzeSBmb3IgdGhlIHZpZXcgdG9cbiAgLy8gcmVhY3QgdG8gc3BlY2lmaWMgY2hhbmdlcyBpbiB0aGUgc3RhdGUgb2YgeW91ciBtb2RlbHMuXG5cbiAgLy8gQ3JlYXRpbmcgYSBCYWNrYm9uZS5WaWV3IGNyZWF0ZXMgaXRzIGluaXRpYWwgZWxlbWVudCBvdXRzaWRlIG9mIHRoZSBET00sXG4gIC8vIGlmIGFuIGV4aXN0aW5nIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLi4uXG4gIHZhciBWaWV3ID0gQmFja2JvbmUuVmlldyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB0aGlzLmNpZCA9IF8udW5pcXVlSWQoJ3ZpZXcnKTtcbiAgICBfLmV4dGVuZCh0aGlzLCBfLnBpY2sob3B0aW9ucywgdmlld09wdGlvbnMpKTtcbiAgICB0aGlzLl9lbnN1cmVFbGVtZW50KCk7XG4gICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgLy8gQ2FjaGVkIHJlZ2V4IHRvIHNwbGl0IGtleXMgZm9yIGBkZWxlZ2F0ZWAuXG4gIHZhciBkZWxlZ2F0ZUV2ZW50U3BsaXR0ZXIgPSAvXihcXFMrKVxccyooLiopJC87XG5cbiAgLy8gTGlzdCBvZiB2aWV3IG9wdGlvbnMgdG8gYmUgc2V0IGFzIHByb3BlcnRpZXMuXG4gIHZhciB2aWV3T3B0aW9ucyA9IFsnbW9kZWwnLCAnY29sbGVjdGlvbicsICdlbCcsICdpZCcsICdhdHRyaWJ1dGVzJywgJ2NsYXNzTmFtZScsICd0YWdOYW1lJywgJ2V2ZW50cyddO1xuXG4gIC8vIFNldCB1cCBhbGwgaW5oZXJpdGFibGUgKipCYWNrYm9uZS5WaWV3KiogcHJvcGVydGllcyBhbmQgbWV0aG9kcy5cbiAgXy5leHRlbmQoVmlldy5wcm90b3R5cGUsIEV2ZW50cywge1xuXG4gICAgLy8gVGhlIGRlZmF1bHQgYHRhZ05hbWVgIG9mIGEgVmlldydzIGVsZW1lbnQgaXMgYFwiZGl2XCJgLlxuICAgIHRhZ05hbWU6ICdkaXYnLFxuXG4gICAgLy8galF1ZXJ5IGRlbGVnYXRlIGZvciBlbGVtZW50IGxvb2t1cCwgc2NvcGVkIHRvIERPTSBlbGVtZW50cyB3aXRoaW4gdGhlXG4gICAgLy8gY3VycmVudCB2aWV3LiBUaGlzIHNob3VsZCBiZSBwcmVmZXJyZWQgdG8gZ2xvYmFsIGxvb2t1cHMgd2hlcmUgcG9zc2libGUuXG4gICAgJDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICAgIHJldHVybiB0aGlzLiRlbC5maW5kKHNlbGVjdG9yKTtcbiAgICB9LFxuXG4gICAgLy8gSW5pdGlhbGl6ZSBpcyBhbiBlbXB0eSBmdW5jdGlvbiBieSBkZWZhdWx0LiBPdmVycmlkZSBpdCB3aXRoIHlvdXIgb3duXG4gICAgLy8gaW5pdGlhbGl6YXRpb24gbG9naWMuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKXt9LFxuXG4gICAgLy8gKipyZW5kZXIqKiBpcyB0aGUgY29yZSBmdW5jdGlvbiB0aGF0IHlvdXIgdmlldyBzaG91bGQgb3ZlcnJpZGUsIGluIG9yZGVyXG4gICAgLy8gdG8gcG9wdWxhdGUgaXRzIGVsZW1lbnQgKGB0aGlzLmVsYCksIHdpdGggdGhlIGFwcHJvcHJpYXRlIEhUTUwuIFRoZVxuICAgIC8vIGNvbnZlbnRpb24gaXMgZm9yICoqcmVuZGVyKiogdG8gYWx3YXlzIHJldHVybiBgdGhpc2AuXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgdGhpcyB2aWV3IGJ5IHRha2luZyB0aGUgZWxlbWVudCBvdXQgb2YgdGhlIERPTSwgYW5kIHJlbW92aW5nIGFueVxuICAgIC8vIGFwcGxpY2FibGUgQmFja2JvbmUuRXZlbnRzIGxpc3RlbmVycy5cbiAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fcmVtb3ZlRWxlbWVudCgpO1xuICAgICAgdGhpcy5zdG9wTGlzdGVuaW5nKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIHRoaXMgdmlldydzIGVsZW1lbnQgZnJvbSB0aGUgZG9jdW1lbnQgYW5kIGFsbCBldmVudCBsaXN0ZW5lcnNcbiAgICAvLyBhdHRhY2hlZCB0byBpdC4gRXhwb3NlZCBmb3Igc3ViY2xhc3NlcyB1c2luZyBhbiBhbHRlcm5hdGl2ZSBET01cbiAgICAvLyBtYW5pcHVsYXRpb24gQVBJLlxuICAgIF9yZW1vdmVFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLnJlbW92ZSgpO1xuICAgIH0sXG5cbiAgICAvLyBDaGFuZ2UgdGhlIHZpZXcncyBlbGVtZW50IChgdGhpcy5lbGAgcHJvcGVydHkpIGFuZCByZS1kZWxlZ2F0ZSB0aGVcbiAgICAvLyB2aWV3J3MgZXZlbnRzIG9uIHRoZSBuZXcgZWxlbWVudC5cbiAgICBzZXRFbGVtZW50OiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICB0aGlzLnVuZGVsZWdhdGVFdmVudHMoKTtcbiAgICAgIHRoaXMuX3NldEVsZW1lbnQoZWxlbWVudCk7XG4gICAgICB0aGlzLmRlbGVnYXRlRXZlbnRzKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQ3JlYXRlcyB0aGUgYHRoaXMuZWxgIGFuZCBgdGhpcy4kZWxgIHJlZmVyZW5jZXMgZm9yIHRoaXMgdmlldyB1c2luZyB0aGVcbiAgICAvLyBnaXZlbiBgZWxgLiBgZWxgIGNhbiBiZSBhIENTUyBzZWxlY3RvciBvciBhbiBIVE1MIHN0cmluZywgYSBqUXVlcnlcbiAgICAvLyBjb250ZXh0IG9yIGFuIGVsZW1lbnQuIFN1YmNsYXNzZXMgY2FuIG92ZXJyaWRlIHRoaXMgdG8gdXRpbGl6ZSBhblxuICAgIC8vIGFsdGVybmF0aXZlIERPTSBtYW5pcHVsYXRpb24gQVBJIGFuZCBhcmUgb25seSByZXF1aXJlZCB0byBzZXQgdGhlXG4gICAgLy8gYHRoaXMuZWxgIHByb3BlcnR5LlxuICAgIF9zZXRFbGVtZW50OiBmdW5jdGlvbihlbCkge1xuICAgICAgdGhpcy4kZWwgPSBlbCBpbnN0YW5jZW9mIEJhY2tib25lLiQgPyBlbCA6IEJhY2tib25lLiQoZWwpO1xuICAgICAgdGhpcy5lbCA9IHRoaXMuJGVsWzBdO1xuICAgIH0sXG5cbiAgICAvLyBTZXQgY2FsbGJhY2tzLCB3aGVyZSBgdGhpcy5ldmVudHNgIGlzIGEgaGFzaCBvZlxuICAgIC8vXG4gICAgLy8gKntcImV2ZW50IHNlbGVjdG9yXCI6IFwiY2FsbGJhY2tcIn0qXG4gICAgLy9cbiAgICAvLyAgICAge1xuICAgIC8vICAgICAgICdtb3VzZWRvd24gLnRpdGxlJzogICdlZGl0JyxcbiAgICAvLyAgICAgICAnY2xpY2sgLmJ1dHRvbic6ICAgICAnc2F2ZScsXG4gICAgLy8gICAgICAgJ2NsaWNrIC5vcGVuJzogICAgICAgZnVuY3Rpb24oZSkgeyAuLi4gfVxuICAgIC8vICAgICB9XG4gICAgLy9cbiAgICAvLyBwYWlycy4gQ2FsbGJhY2tzIHdpbGwgYmUgYm91bmQgdG8gdGhlIHZpZXcsIHdpdGggYHRoaXNgIHNldCBwcm9wZXJseS5cbiAgICAvLyBVc2VzIGV2ZW50IGRlbGVnYXRpb24gZm9yIGVmZmljaWVuY3kuXG4gICAgLy8gT21pdHRpbmcgdGhlIHNlbGVjdG9yIGJpbmRzIHRoZSBldmVudCB0byBgdGhpcy5lbGAuXG4gICAgZGVsZWdhdGVFdmVudHM6IGZ1bmN0aW9uKGV2ZW50cykge1xuICAgICAgZXZlbnRzIHx8IChldmVudHMgPSBfLnJlc3VsdCh0aGlzLCAnZXZlbnRzJykpO1xuICAgICAgaWYgKCFldmVudHMpIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy51bmRlbGVnYXRlRXZlbnRzKCk7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gZXZlbnRzKSB7XG4gICAgICAgIHZhciBtZXRob2QgPSBldmVudHNba2V5XTtcbiAgICAgICAgaWYgKCFfLmlzRnVuY3Rpb24obWV0aG9kKSkgbWV0aG9kID0gdGhpc1ttZXRob2RdO1xuICAgICAgICBpZiAoIW1ldGhvZCkgY29udGludWU7XG4gICAgICAgIHZhciBtYXRjaCA9IGtleS5tYXRjaChkZWxlZ2F0ZUV2ZW50U3BsaXR0ZXIpO1xuICAgICAgICB0aGlzLmRlbGVnYXRlKG1hdGNoWzFdLCBtYXRjaFsyXSwgXy5iaW5kKG1ldGhvZCwgdGhpcykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEFkZCBhIHNpbmdsZSBldmVudCBsaXN0ZW5lciB0byB0aGUgdmlldydzIGVsZW1lbnQgKG9yIGEgY2hpbGQgZWxlbWVudFxuICAgIC8vIHVzaW5nIGBzZWxlY3RvcmApLiBUaGlzIG9ubHkgd29ya3MgZm9yIGRlbGVnYXRlLWFibGUgZXZlbnRzOiBub3QgYGZvY3VzYCxcbiAgICAvLyBgYmx1cmAsIGFuZCBub3QgYGNoYW5nZWAsIGBzdWJtaXRgLCBhbmQgYHJlc2V0YCBpbiBJbnRlcm5ldCBFeHBsb3Jlci5cbiAgICBkZWxlZ2F0ZTogZnVuY3Rpb24oZXZlbnROYW1lLCBzZWxlY3RvciwgbGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuJGVsLm9uKGV2ZW50TmFtZSArICcuZGVsZWdhdGVFdmVudHMnICsgdGhpcy5jaWQsIHNlbGVjdG9yLCBsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQ2xlYXJzIGFsbCBjYWxsYmFja3MgcHJldmlvdXNseSBib3VuZCB0byB0aGUgdmlldyBieSBgZGVsZWdhdGVFdmVudHNgLlxuICAgIC8vIFlvdSB1c3VhbGx5IGRvbid0IG5lZWQgdG8gdXNlIHRoaXMsIGJ1dCBtYXkgd2lzaCB0byBpZiB5b3UgaGF2ZSBtdWx0aXBsZVxuICAgIC8vIEJhY2tib25lIHZpZXdzIGF0dGFjaGVkIHRvIHRoZSBzYW1lIERPTSBlbGVtZW50LlxuICAgIHVuZGVsZWdhdGVFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuJGVsKSB0aGlzLiRlbC5vZmYoJy5kZWxlZ2F0ZUV2ZW50cycgKyB0aGlzLmNpZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQSBmaW5lci1ncmFpbmVkIGB1bmRlbGVnYXRlRXZlbnRzYCBmb3IgcmVtb3ZpbmcgYSBzaW5nbGUgZGVsZWdhdGVkIGV2ZW50LlxuICAgIC8vIGBzZWxlY3RvcmAgYW5kIGBsaXN0ZW5lcmAgYXJlIGJvdGggb3B0aW9uYWwuXG4gICAgdW5kZWxlZ2F0ZTogZnVuY3Rpb24oZXZlbnROYW1lLCBzZWxlY3RvciwgbGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuJGVsLm9mZihldmVudE5hbWUgKyAnLmRlbGVnYXRlRXZlbnRzJyArIHRoaXMuY2lkLCBzZWxlY3RvciwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFByb2R1Y2VzIGEgRE9NIGVsZW1lbnQgdG8gYmUgYXNzaWduZWQgdG8geW91ciB2aWV3LiBFeHBvc2VkIGZvclxuICAgIC8vIHN1YmNsYXNzZXMgdXNpbmcgYW4gYWx0ZXJuYXRpdmUgRE9NIG1hbmlwdWxhdGlvbiBBUEkuXG4gICAgX2NyZWF0ZUVsZW1lbnQ6IGZ1bmN0aW9uKHRhZ05hbWUpIHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICAgIH0sXG5cbiAgICAvLyBFbnN1cmUgdGhhdCB0aGUgVmlldyBoYXMgYSBET00gZWxlbWVudCB0byByZW5kZXIgaW50by5cbiAgICAvLyBJZiBgdGhpcy5lbGAgaXMgYSBzdHJpbmcsIHBhc3MgaXQgdGhyb3VnaCBgJCgpYCwgdGFrZSB0aGUgZmlyc3RcbiAgICAvLyBtYXRjaGluZyBlbGVtZW50LCBhbmQgcmUtYXNzaWduIGl0IHRvIGBlbGAuIE90aGVyd2lzZSwgY3JlYXRlXG4gICAgLy8gYW4gZWxlbWVudCBmcm9tIHRoZSBgaWRgLCBgY2xhc3NOYW1lYCBhbmQgYHRhZ05hbWVgIHByb3BlcnRpZXMuXG4gICAgX2Vuc3VyZUVsZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLmVsKSB7XG4gICAgICAgIHZhciBhdHRycyA9IF8uZXh0ZW5kKHt9LCBfLnJlc3VsdCh0aGlzLCAnYXR0cmlidXRlcycpKTtcbiAgICAgICAgaWYgKHRoaXMuaWQpIGF0dHJzLmlkID0gXy5yZXN1bHQodGhpcywgJ2lkJyk7XG4gICAgICAgIGlmICh0aGlzLmNsYXNzTmFtZSkgYXR0cnNbJ2NsYXNzJ10gPSBfLnJlc3VsdCh0aGlzLCAnY2xhc3NOYW1lJyk7XG4gICAgICAgIHRoaXMuc2V0RWxlbWVudCh0aGlzLl9jcmVhdGVFbGVtZW50KF8ucmVzdWx0KHRoaXMsICd0YWdOYW1lJykpKTtcbiAgICAgICAgdGhpcy5fc2V0QXR0cmlidXRlcyhhdHRycyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNldEVsZW1lbnQoXy5yZXN1bHQodGhpcywgJ2VsJykpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBTZXQgYXR0cmlidXRlcyBmcm9tIGEgaGFzaCBvbiB0aGlzIHZpZXcncyBlbGVtZW50LiAgRXhwb3NlZCBmb3JcbiAgICAvLyBzdWJjbGFzc2VzIHVzaW5nIGFuIGFsdGVybmF0aXZlIERPTSBtYW5pcHVsYXRpb24gQVBJLlxuICAgIF9zZXRBdHRyaWJ1dGVzOiBmdW5jdGlvbihhdHRyaWJ1dGVzKSB7XG4gICAgICB0aGlzLiRlbC5hdHRyKGF0dHJpYnV0ZXMpO1xuICAgIH1cblxuICB9KTtcblxuICAvLyBCYWNrYm9uZS5zeW5jXG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvLyBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHRvIGNoYW5nZSB0aGUgbWFubmVyIGluIHdoaWNoIEJhY2tib25lIHBlcnNpc3RzXG4gIC8vIG1vZGVscyB0byB0aGUgc2VydmVyLiBZb3Ugd2lsbCBiZSBwYXNzZWQgdGhlIHR5cGUgb2YgcmVxdWVzdCwgYW5kIHRoZVxuICAvLyBtb2RlbCBpbiBxdWVzdGlvbi4gQnkgZGVmYXVsdCwgbWFrZXMgYSBSRVNUZnVsIEFqYXggcmVxdWVzdFxuICAvLyB0byB0aGUgbW9kZWwncyBgdXJsKClgLiBTb21lIHBvc3NpYmxlIGN1c3RvbWl6YXRpb25zIGNvdWxkIGJlOlxuICAvL1xuICAvLyAqIFVzZSBgc2V0VGltZW91dGAgdG8gYmF0Y2ggcmFwaWQtZmlyZSB1cGRhdGVzIGludG8gYSBzaW5nbGUgcmVxdWVzdC5cbiAgLy8gKiBTZW5kIHVwIHRoZSBtb2RlbHMgYXMgWE1MIGluc3RlYWQgb2YgSlNPTi5cbiAgLy8gKiBQZXJzaXN0IG1vZGVscyB2aWEgV2ViU29ja2V0cyBpbnN0ZWFkIG9mIEFqYXguXG4gIC8vXG4gIC8vIFR1cm4gb24gYEJhY2tib25lLmVtdWxhdGVIVFRQYCBpbiBvcmRlciB0byBzZW5kIGBQVVRgIGFuZCBgREVMRVRFYCByZXF1ZXN0c1xuICAvLyBhcyBgUE9TVGAsIHdpdGggYSBgX21ldGhvZGAgcGFyYW1ldGVyIGNvbnRhaW5pbmcgdGhlIHRydWUgSFRUUCBtZXRob2QsXG4gIC8vIGFzIHdlbGwgYXMgYWxsIHJlcXVlc3RzIHdpdGggdGhlIGJvZHkgYXMgYGFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZGBcbiAgLy8gaW5zdGVhZCBvZiBgYXBwbGljYXRpb24vanNvbmAgd2l0aCB0aGUgbW9kZWwgaW4gYSBwYXJhbSBuYW1lZCBgbW9kZWxgLlxuICAvLyBVc2VmdWwgd2hlbiBpbnRlcmZhY2luZyB3aXRoIHNlcnZlci1zaWRlIGxhbmd1YWdlcyBsaWtlICoqUEhQKiogdGhhdCBtYWtlXG4gIC8vIGl0IGRpZmZpY3VsdCB0byByZWFkIHRoZSBib2R5IG9mIGBQVVRgIHJlcXVlc3RzLlxuICBCYWNrYm9uZS5zeW5jID0gZnVuY3Rpb24obWV0aG9kLCBtb2RlbCwgb3B0aW9ucykge1xuICAgIHZhciB0eXBlID0gbWV0aG9kTWFwW21ldGhvZF07XG5cbiAgICAvLyBEZWZhdWx0IG9wdGlvbnMsIHVubGVzcyBzcGVjaWZpZWQuXG4gICAgXy5kZWZhdWx0cyhvcHRpb25zIHx8IChvcHRpb25zID0ge30pLCB7XG4gICAgICBlbXVsYXRlSFRUUDogQmFja2JvbmUuZW11bGF0ZUhUVFAsXG4gICAgICBlbXVsYXRlSlNPTjogQmFja2JvbmUuZW11bGF0ZUpTT05cbiAgICB9KTtcblxuICAgIC8vIERlZmF1bHQgSlNPTi1yZXF1ZXN0IG9wdGlvbnMuXG4gICAgdmFyIHBhcmFtcyA9IHt0eXBlOiB0eXBlLCBkYXRhVHlwZTogJ2pzb24nfTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHdlIGhhdmUgYSBVUkwuXG4gICAgaWYgKCFvcHRpb25zLnVybCkge1xuICAgICAgcGFyYW1zLnVybCA9IF8ucmVzdWx0KG1vZGVsLCAndXJsJykgfHwgdXJsRXJyb3IoKTtcbiAgICB9XG5cbiAgICAvLyBFbnN1cmUgdGhhdCB3ZSBoYXZlIHRoZSBhcHByb3ByaWF0ZSByZXF1ZXN0IGRhdGEuXG4gICAgaWYgKG9wdGlvbnMuZGF0YSA9PSBudWxsICYmIG1vZGVsICYmIChtZXRob2QgPT09ICdjcmVhdGUnIHx8IG1ldGhvZCA9PT0gJ3VwZGF0ZScgfHwgbWV0aG9kID09PSAncGF0Y2gnKSkge1xuICAgICAgcGFyYW1zLmNvbnRlbnRUeXBlID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgcGFyYW1zLmRhdGEgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLmF0dHJzIHx8IG1vZGVsLnRvSlNPTihvcHRpb25zKSk7XG4gICAgfVxuXG4gICAgLy8gRm9yIG9sZGVyIHNlcnZlcnMsIGVtdWxhdGUgSlNPTiBieSBlbmNvZGluZyB0aGUgcmVxdWVzdCBpbnRvIGFuIEhUTUwtZm9ybS5cbiAgICBpZiAob3B0aW9ucy5lbXVsYXRlSlNPTikge1xuICAgICAgcGFyYW1zLmNvbnRlbnRUeXBlID0gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCc7XG4gICAgICBwYXJhbXMuZGF0YSA9IHBhcmFtcy5kYXRhID8ge21vZGVsOiBwYXJhbXMuZGF0YX0gOiB7fTtcbiAgICB9XG5cbiAgICAvLyBGb3Igb2xkZXIgc2VydmVycywgZW11bGF0ZSBIVFRQIGJ5IG1pbWlja2luZyB0aGUgSFRUUCBtZXRob2Qgd2l0aCBgX21ldGhvZGBcbiAgICAvLyBBbmQgYW4gYFgtSFRUUC1NZXRob2QtT3ZlcnJpZGVgIGhlYWRlci5cbiAgICBpZiAob3B0aW9ucy5lbXVsYXRlSFRUUCAmJiAodHlwZSA9PT0gJ1BVVCcgfHwgdHlwZSA9PT0gJ0RFTEVURScgfHwgdHlwZSA9PT0gJ1BBVENIJykpIHtcbiAgICAgIHBhcmFtcy50eXBlID0gJ1BPU1QnO1xuICAgICAgaWYgKG9wdGlvbnMuZW11bGF0ZUpTT04pIHBhcmFtcy5kYXRhLl9tZXRob2QgPSB0eXBlO1xuICAgICAgdmFyIGJlZm9yZVNlbmQgPSBvcHRpb25zLmJlZm9yZVNlbmQ7XG4gICAgICBvcHRpb25zLmJlZm9yZVNlbmQgPSBmdW5jdGlvbih4aHIpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtSFRUUC1NZXRob2QtT3ZlcnJpZGUnLCB0eXBlKTtcbiAgICAgICAgaWYgKGJlZm9yZVNlbmQpIHJldHVybiBiZWZvcmVTZW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIERvbid0IHByb2Nlc3MgZGF0YSBvbiBhIG5vbi1HRVQgcmVxdWVzdC5cbiAgICBpZiAocGFyYW1zLnR5cGUgIT09ICdHRVQnICYmICFvcHRpb25zLmVtdWxhdGVKU09OKSB7XG4gICAgICBwYXJhbXMucHJvY2Vzc0RhdGEgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBQYXNzIGFsb25nIGB0ZXh0U3RhdHVzYCBhbmQgYGVycm9yVGhyb3duYCBmcm9tIGpRdWVyeS5cbiAgICB2YXIgZXJyb3IgPSBvcHRpb25zLmVycm9yO1xuICAgIG9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbih4aHIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICBvcHRpb25zLnRleHRTdGF0dXMgPSB0ZXh0U3RhdHVzO1xuICAgICAgb3B0aW9ucy5lcnJvclRocm93biA9IGVycm9yVGhyb3duO1xuICAgICAgaWYgKGVycm9yKSBlcnJvci5jYWxsKG9wdGlvbnMuY29udGV4dCwgeGhyLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgfTtcblxuICAgIC8vIE1ha2UgdGhlIHJlcXVlc3QsIGFsbG93aW5nIHRoZSB1c2VyIHRvIG92ZXJyaWRlIGFueSBBamF4IG9wdGlvbnMuXG4gICAgdmFyIHhociA9IG9wdGlvbnMueGhyID0gQmFja2JvbmUuYWpheChfLmV4dGVuZChwYXJhbXMsIG9wdGlvbnMpKTtcbiAgICBtb2RlbC50cmlnZ2VyKCdyZXF1ZXN0JywgbW9kZWwsIHhociwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHhocjtcbiAgfTtcblxuICAvLyBNYXAgZnJvbSBDUlVEIHRvIEhUVFAgZm9yIG91ciBkZWZhdWx0IGBCYWNrYm9uZS5zeW5jYCBpbXBsZW1lbnRhdGlvbi5cbiAgdmFyIG1ldGhvZE1hcCA9IHtcbiAgICAnY3JlYXRlJzogJ1BPU1QnLFxuICAgICd1cGRhdGUnOiAnUFVUJyxcbiAgICAncGF0Y2gnOiAgJ1BBVENIJyxcbiAgICAnZGVsZXRlJzogJ0RFTEVURScsXG4gICAgJ3JlYWQnOiAgICdHRVQnXG4gIH07XG5cbiAgLy8gU2V0IHRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIGBCYWNrYm9uZS5hamF4YCB0byBwcm94eSB0aHJvdWdoIHRvIGAkYC5cbiAgLy8gT3ZlcnJpZGUgdGhpcyBpZiB5b3UnZCBsaWtlIHRvIHVzZSBhIGRpZmZlcmVudCBsaWJyYXJ5LlxuICBCYWNrYm9uZS5hamF4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEJhY2tib25lLiQuYWpheC5hcHBseShCYWNrYm9uZS4kLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIEJhY2tib25lLlJvdXRlclxuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSb3V0ZXJzIG1hcCBmYXV4LVVSTHMgdG8gYWN0aW9ucywgYW5kIGZpcmUgZXZlbnRzIHdoZW4gcm91dGVzIGFyZVxuICAvLyBtYXRjaGVkLiBDcmVhdGluZyBhIG5ldyBvbmUgc2V0cyBpdHMgYHJvdXRlc2AgaGFzaCwgaWYgbm90IHNldCBzdGF0aWNhbGx5LlxuICB2YXIgUm91dGVyID0gQmFja2JvbmUuUm91dGVyID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgaWYgKG9wdGlvbnMucm91dGVzKSB0aGlzLnJvdXRlcyA9IG9wdGlvbnMucm91dGVzO1xuICAgIHRoaXMuX2JpbmRSb3V0ZXMoKTtcbiAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICAvLyBDYWNoZWQgcmVndWxhciBleHByZXNzaW9ucyBmb3IgbWF0Y2hpbmcgbmFtZWQgcGFyYW0gcGFydHMgYW5kIHNwbGF0dGVkXG4gIC8vIHBhcnRzIG9mIHJvdXRlIHN0cmluZ3MuXG4gIHZhciBvcHRpb25hbFBhcmFtID0gL1xcKCguKj8pXFwpL2c7XG4gIHZhciBuYW1lZFBhcmFtICAgID0gLyhcXChcXD8pPzpcXHcrL2c7XG4gIHZhciBzcGxhdFBhcmFtICAgID0gL1xcKlxcdysvZztcbiAgdmFyIGVzY2FwZVJlZ0V4cCAgPSAvW1xcLXt9XFxbXFxdKz8uLFxcXFxcXF4kfCNcXHNdL2c7XG5cbiAgLy8gU2V0IHVwIGFsbCBpbmhlcml0YWJsZSAqKkJhY2tib25lLlJvdXRlcioqIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMuXG4gIF8uZXh0ZW5kKFJvdXRlci5wcm90b3R5cGUsIEV2ZW50cywge1xuXG4gICAgLy8gSW5pdGlhbGl6ZSBpcyBhbiBlbXB0eSBmdW5jdGlvbiBieSBkZWZhdWx0LiBPdmVycmlkZSBpdCB3aXRoIHlvdXIgb3duXG4gICAgLy8gaW5pdGlhbGl6YXRpb24gbG9naWMuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKXt9LFxuXG4gICAgLy8gTWFudWFsbHkgYmluZCBhIHNpbmdsZSBuYW1lZCByb3V0ZSB0byBhIGNhbGxiYWNrLiBGb3IgZXhhbXBsZTpcbiAgICAvL1xuICAgIC8vICAgICB0aGlzLnJvdXRlKCdzZWFyY2gvOnF1ZXJ5L3A6bnVtJywgJ3NlYXJjaCcsIGZ1bmN0aW9uKHF1ZXJ5LCBudW0pIHtcbiAgICAvLyAgICAgICAuLi5cbiAgICAvLyAgICAgfSk7XG4gICAgLy9cbiAgICByb3V0ZTogZnVuY3Rpb24ocm91dGUsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICBpZiAoIV8uaXNSZWdFeHAocm91dGUpKSByb3V0ZSA9IHRoaXMuX3JvdXRlVG9SZWdFeHAocm91dGUpO1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihuYW1lKSkge1xuICAgICAgICBjYWxsYmFjayA9IG5hbWU7XG4gICAgICAgIG5hbWUgPSAnJztcbiAgICAgIH1cbiAgICAgIGlmICghY2FsbGJhY2spIGNhbGxiYWNrID0gdGhpc1tuYW1lXTtcbiAgICAgIHZhciByb3V0ZXIgPSB0aGlzO1xuICAgICAgQmFja2JvbmUuaGlzdG9yeS5yb3V0ZShyb3V0ZSwgZnVuY3Rpb24oZnJhZ21lbnQpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSByb3V0ZXIuX2V4dHJhY3RQYXJhbWV0ZXJzKHJvdXRlLCBmcmFnbWVudCk7XG4gICAgICAgIGlmIChyb3V0ZXIuZXhlY3V0ZShjYWxsYmFjaywgYXJncywgbmFtZSkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgcm91dGVyLnRyaWdnZXIuYXBwbHkocm91dGVyLCBbJ3JvdXRlOicgKyBuYW1lXS5jb25jYXQoYXJncykpO1xuICAgICAgICAgIHJvdXRlci50cmlnZ2VyKCdyb3V0ZScsIG5hbWUsIGFyZ3MpO1xuICAgICAgICAgIEJhY2tib25lLmhpc3RvcnkudHJpZ2dlcigncm91dGUnLCByb3V0ZXIsIG5hbWUsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBFeGVjdXRlIGEgcm91dGUgaGFuZGxlciB3aXRoIHRoZSBwcm92aWRlZCBwYXJhbWV0ZXJzLiAgVGhpcyBpcyBhblxuICAgIC8vIGV4Y2VsbGVudCBwbGFjZSB0byBkbyBwcmUtcm91dGUgc2V0dXAgb3IgcG9zdC1yb3V0ZSBjbGVhbnVwLlxuICAgIGV4ZWN1dGU6IGZ1bmN0aW9uKGNhbGxiYWNrLCBhcmdzLCBuYW1lKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH0sXG5cbiAgICAvLyBTaW1wbGUgcHJveHkgdG8gYEJhY2tib25lLmhpc3RvcnlgIHRvIHNhdmUgYSBmcmFnbWVudCBpbnRvIHRoZSBoaXN0b3J5LlxuICAgIG5hdmlnYXRlOiBmdW5jdGlvbihmcmFnbWVudCwgb3B0aW9ucykge1xuICAgICAgQmFja2JvbmUuaGlzdG9yeS5uYXZpZ2F0ZShmcmFnbWVudCwgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQmluZCBhbGwgZGVmaW5lZCByb3V0ZXMgdG8gYEJhY2tib25lLmhpc3RvcnlgLiBXZSBoYXZlIHRvIHJldmVyc2UgdGhlXG4gICAgLy8gb3JkZXIgb2YgdGhlIHJvdXRlcyBoZXJlIHRvIHN1cHBvcnQgYmVoYXZpb3Igd2hlcmUgdGhlIG1vc3QgZ2VuZXJhbFxuICAgIC8vIHJvdXRlcyBjYW4gYmUgZGVmaW5lZCBhdCB0aGUgYm90dG9tIG9mIHRoZSByb3V0ZSBtYXAuXG4gICAgX2JpbmRSb3V0ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLnJvdXRlcykgcmV0dXJuO1xuICAgICAgdGhpcy5yb3V0ZXMgPSBfLnJlc3VsdCh0aGlzLCAncm91dGVzJyk7XG4gICAgICB2YXIgcm91dGUsIHJvdXRlcyA9IF8ua2V5cyh0aGlzLnJvdXRlcyk7XG4gICAgICB3aGlsZSAoKHJvdXRlID0gcm91dGVzLnBvcCgpKSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMucm91dGUocm91dGUsIHRoaXMucm91dGVzW3JvdXRlXSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIENvbnZlcnQgYSByb3V0ZSBzdHJpbmcgaW50byBhIHJlZ3VsYXIgZXhwcmVzc2lvbiwgc3VpdGFibGUgZm9yIG1hdGNoaW5nXG4gICAgLy8gYWdhaW5zdCB0aGUgY3VycmVudCBsb2NhdGlvbiBoYXNoLlxuICAgIF9yb3V0ZVRvUmVnRXhwOiBmdW5jdGlvbihyb3V0ZSkge1xuICAgICAgcm91dGUgPSByb3V0ZS5yZXBsYWNlKGVzY2FwZVJlZ0V4cCwgJ1xcXFwkJicpXG4gICAgICAgICAgICAgICAgICAgLnJlcGxhY2Uob3B0aW9uYWxQYXJhbSwgJyg/OiQxKT8nKVxuICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKG5hbWVkUGFyYW0sIGZ1bmN0aW9uKG1hdGNoLCBvcHRpb25hbCkge1xuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbmFsID8gbWF0Y2ggOiAnKFteLz9dKyknO1xuICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgLnJlcGxhY2Uoc3BsYXRQYXJhbSwgJyhbXj9dKj8pJyk7XG4gICAgICByZXR1cm4gbmV3IFJlZ0V4cCgnXicgKyByb3V0ZSArICcoPzpcXFxcPyhbXFxcXHNcXFxcU10qKSk/JCcpO1xuICAgIH0sXG5cbiAgICAvLyBHaXZlbiBhIHJvdXRlLCBhbmQgYSBVUkwgZnJhZ21lbnQgdGhhdCBpdCBtYXRjaGVzLCByZXR1cm4gdGhlIGFycmF5IG9mXG4gICAgLy8gZXh0cmFjdGVkIGRlY29kZWQgcGFyYW1ldGVycy4gRW1wdHkgb3IgdW5tYXRjaGVkIHBhcmFtZXRlcnMgd2lsbCBiZVxuICAgIC8vIHRyZWF0ZWQgYXMgYG51bGxgIHRvIG5vcm1hbGl6ZSBjcm9zcy1icm93c2VyIGJlaGF2aW9yLlxuICAgIF9leHRyYWN0UGFyYW1ldGVyczogZnVuY3Rpb24ocm91dGUsIGZyYWdtZW50KSB7XG4gICAgICB2YXIgcGFyYW1zID0gcm91dGUuZXhlYyhmcmFnbWVudCkuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gXy5tYXAocGFyYW1zLCBmdW5jdGlvbihwYXJhbSwgaSkge1xuICAgICAgICAvLyBEb24ndCBkZWNvZGUgdGhlIHNlYXJjaCBwYXJhbXMuXG4gICAgICAgIGlmIChpID09PSBwYXJhbXMubGVuZ3RoIC0gMSkgcmV0dXJuIHBhcmFtIHx8IG51bGw7XG4gICAgICAgIHJldHVybiBwYXJhbSA/IGRlY29kZVVSSUNvbXBvbmVudChwYXJhbSkgOiBudWxsO1xuICAgICAgfSk7XG4gICAgfVxuXG4gIH0pO1xuXG4gIC8vIEJhY2tib25lLkhpc3RvcnlcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEhhbmRsZXMgY3Jvc3MtYnJvd3NlciBoaXN0b3J5IG1hbmFnZW1lbnQsIGJhc2VkIG9uIGVpdGhlclxuICAvLyBbcHVzaFN0YXRlXShodHRwOi8vZGl2ZWludG9odG1sNS5pbmZvL2hpc3RvcnkuaHRtbCkgYW5kIHJlYWwgVVJMcywgb3JcbiAgLy8gW29uaGFzaGNoYW5nZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9ET00vd2luZG93Lm9uaGFzaGNoYW5nZSlcbiAgLy8gYW5kIFVSTCBmcmFnbWVudHMuIElmIHRoZSBicm93c2VyIHN1cHBvcnRzIG5laXRoZXIgKG9sZCBJRSwgbmF0Y2gpLFxuICAvLyBmYWxscyBiYWNrIHRvIHBvbGxpbmcuXG4gIHZhciBIaXN0b3J5ID0gQmFja2JvbmUuSGlzdG9yeSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaGFuZGxlcnMgPSBbXTtcbiAgICB0aGlzLmNoZWNrVXJsID0gXy5iaW5kKHRoaXMuY2hlY2tVcmwsIHRoaXMpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgYEhpc3RvcnlgIGNhbiBiZSB1c2VkIG91dHNpZGUgb2YgdGhlIGJyb3dzZXIuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLmxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xuICAgICAgdGhpcy5oaXN0b3J5ID0gd2luZG93Lmhpc3Rvcnk7XG4gICAgfVxuICB9O1xuXG4gIC8vIENhY2hlZCByZWdleCBmb3Igc3RyaXBwaW5nIGEgbGVhZGluZyBoYXNoL3NsYXNoIGFuZCB0cmFpbGluZyBzcGFjZS5cbiAgdmFyIHJvdXRlU3RyaXBwZXIgPSAvXlsjXFwvXXxcXHMrJC9nO1xuXG4gIC8vIENhY2hlZCByZWdleCBmb3Igc3RyaXBwaW5nIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMuXG4gIHZhciByb290U3RyaXBwZXIgPSAvXlxcLyt8XFwvKyQvZztcblxuICAvLyBDYWNoZWQgcmVnZXggZm9yIHN0cmlwcGluZyB1cmxzIG9mIGhhc2guXG4gIHZhciBwYXRoU3RyaXBwZXIgPSAvIy4qJC87XG5cbiAgLy8gSGFzIHRoZSBoaXN0b3J5IGhhbmRsaW5nIGFscmVhZHkgYmVlbiBzdGFydGVkP1xuICBIaXN0b3J5LnN0YXJ0ZWQgPSBmYWxzZTtcblxuICAvLyBTZXQgdXAgYWxsIGluaGVyaXRhYmxlICoqQmFja2JvbmUuSGlzdG9yeSoqIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMuXG4gIF8uZXh0ZW5kKEhpc3RvcnkucHJvdG90eXBlLCBFdmVudHMsIHtcblxuICAgIC8vIFRoZSBkZWZhdWx0IGludGVydmFsIHRvIHBvbGwgZm9yIGhhc2ggY2hhbmdlcywgaWYgbmVjZXNzYXJ5LCBpc1xuICAgIC8vIHR3ZW50eSB0aW1lcyBhIHNlY29uZC5cbiAgICBpbnRlcnZhbDogNTAsXG5cbiAgICAvLyBBcmUgd2UgYXQgdGhlIGFwcCByb290P1xuICAgIGF0Um9vdDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcGF0aCA9IHRoaXMubG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvW15cXC9dJC8sICckJi8nKTtcbiAgICAgIHJldHVybiBwYXRoID09PSB0aGlzLnJvb3QgJiYgIXRoaXMuZ2V0U2VhcmNoKCk7XG4gICAgfSxcblxuICAgIC8vIERvZXMgdGhlIHBhdGhuYW1lIG1hdGNoIHRoZSByb290P1xuICAgIG1hdGNoUm9vdDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcGF0aCA9IHRoaXMuZGVjb2RlRnJhZ21lbnQodGhpcy5sb2NhdGlvbi5wYXRobmFtZSk7XG4gICAgICB2YXIgcm9vdCA9IHBhdGguc2xpY2UoMCwgdGhpcy5yb290Lmxlbmd0aCAtIDEpICsgJy8nO1xuICAgICAgcmV0dXJuIHJvb3QgPT09IHRoaXMucm9vdDtcbiAgICB9LFxuXG4gICAgLy8gVW5pY29kZSBjaGFyYWN0ZXJzIGluIGBsb2NhdGlvbi5wYXRobmFtZWAgYXJlIHBlcmNlbnQgZW5jb2RlZCBzbyB0aGV5J3JlXG4gICAgLy8gZGVjb2RlZCBmb3IgY29tcGFyaXNvbi4gYCUyNWAgc2hvdWxkIG5vdCBiZSBkZWNvZGVkIHNpbmNlIGl0IG1heSBiZSBwYXJ0XG4gICAgLy8gb2YgYW4gZW5jb2RlZCBwYXJhbWV0ZXIuXG4gICAgZGVjb2RlRnJhZ21lbnQ6IGZ1bmN0aW9uKGZyYWdtZW50KSB7XG4gICAgICByZXR1cm4gZGVjb2RlVVJJKGZyYWdtZW50LnJlcGxhY2UoLyUyNS9nLCAnJTI1MjUnKSk7XG4gICAgfSxcblxuICAgIC8vIEluIElFNiwgdGhlIGhhc2ggZnJhZ21lbnQgYW5kIHNlYXJjaCBwYXJhbXMgYXJlIGluY29ycmVjdCBpZiB0aGVcbiAgICAvLyBmcmFnbWVudCBjb250YWlucyBgP2AuXG4gICAgZ2V0U2VhcmNoOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBtYXRjaCA9IHRoaXMubG9jYXRpb24uaHJlZi5yZXBsYWNlKC8jLiovLCAnJykubWF0Y2goL1xcPy4rLyk7XG4gICAgICByZXR1cm4gbWF0Y2ggPyBtYXRjaFswXSA6ICcnO1xuICAgIH0sXG5cbiAgICAvLyBHZXRzIHRoZSB0cnVlIGhhc2ggdmFsdWUuIENhbm5vdCB1c2UgbG9jYXRpb24uaGFzaCBkaXJlY3RseSBkdWUgdG8gYnVnXG4gICAgLy8gaW4gRmlyZWZveCB3aGVyZSBsb2NhdGlvbi5oYXNoIHdpbGwgYWx3YXlzIGJlIGRlY29kZWQuXG4gICAgZ2V0SGFzaDogZnVuY3Rpb24od2luZG93KSB7XG4gICAgICB2YXIgbWF0Y2ggPSAod2luZG93IHx8IHRoaXMpLmxvY2F0aW9uLmhyZWYubWF0Y2goLyMoLiopJC8pO1xuICAgICAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0gOiAnJztcbiAgICB9LFxuXG4gICAgLy8gR2V0IHRoZSBwYXRobmFtZSBhbmQgc2VhcmNoIHBhcmFtcywgd2l0aG91dCB0aGUgcm9vdC5cbiAgICBnZXRQYXRoOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBwYXRoID0gdGhpcy5kZWNvZGVGcmFnbWVudChcbiAgICAgICAgdGhpcy5sb2NhdGlvbi5wYXRobmFtZSArIHRoaXMuZ2V0U2VhcmNoKClcbiAgICAgICkuc2xpY2UodGhpcy5yb290Lmxlbmd0aCAtIDEpO1xuICAgICAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLycgPyBwYXRoLnNsaWNlKDEpIDogcGF0aDtcbiAgICB9LFxuXG4gICAgLy8gR2V0IHRoZSBjcm9zcy1icm93c2VyIG5vcm1hbGl6ZWQgVVJMIGZyYWdtZW50IGZyb20gdGhlIHBhdGggb3IgaGFzaC5cbiAgICBnZXRGcmFnbWVudDogZnVuY3Rpb24oZnJhZ21lbnQpIHtcbiAgICAgIGlmIChmcmFnbWVudCA9PSBudWxsKSB7XG4gICAgICAgIGlmICh0aGlzLl91c2VQdXNoU3RhdGUgfHwgIXRoaXMuX3dhbnRzSGFzaENoYW5nZSkge1xuICAgICAgICAgIGZyYWdtZW50ID0gdGhpcy5nZXRQYXRoKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZnJhZ21lbnQgPSB0aGlzLmdldEhhc2goKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZyYWdtZW50LnJlcGxhY2Uocm91dGVTdHJpcHBlciwgJycpO1xuICAgIH0sXG5cbiAgICAvLyBTdGFydCB0aGUgaGFzaCBjaGFuZ2UgaGFuZGxpbmcsIHJldHVybmluZyBgdHJ1ZWAgaWYgdGhlIGN1cnJlbnQgVVJMIG1hdGNoZXNcbiAgICAvLyBhbiBleGlzdGluZyByb3V0ZSwgYW5kIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgIHN0YXJ0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBpZiAoSGlzdG9yeS5zdGFydGVkKSB0aHJvdyBuZXcgRXJyb3IoJ0JhY2tib25lLmhpc3RvcnkgaGFzIGFscmVhZHkgYmVlbiBzdGFydGVkJyk7XG4gICAgICBIaXN0b3J5LnN0YXJ0ZWQgPSB0cnVlO1xuXG4gICAgICAvLyBGaWd1cmUgb3V0IHRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uIERvIHdlIG5lZWQgYW4gaWZyYW1lP1xuICAgICAgLy8gSXMgcHVzaFN0YXRlIGRlc2lyZWQgLi4uIGlzIGl0IGF2YWlsYWJsZT9cbiAgICAgIHRoaXMub3B0aW9ucyAgICAgICAgICA9IF8uZXh0ZW5kKHtyb290OiAnLyd9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgdGhpcy5yb290ICAgICAgICAgICAgID0gdGhpcy5vcHRpb25zLnJvb3Q7XG4gICAgICB0aGlzLl93YW50c0hhc2hDaGFuZ2UgPSB0aGlzLm9wdGlvbnMuaGFzaENoYW5nZSAhPT0gZmFsc2U7XG4gICAgICB0aGlzLl9oYXNIYXNoQ2hhbmdlICAgPSAnb25oYXNoY2hhbmdlJyBpbiB3aW5kb3cgJiYgKGRvY3VtZW50LmRvY3VtZW50TW9kZSA9PT0gdm9pZCAwIHx8IGRvY3VtZW50LmRvY3VtZW50TW9kZSA+IDcpO1xuICAgICAgdGhpcy5fdXNlSGFzaENoYW5nZSAgID0gdGhpcy5fd2FudHNIYXNoQ2hhbmdlICYmIHRoaXMuX2hhc0hhc2hDaGFuZ2U7XG4gICAgICB0aGlzLl93YW50c1B1c2hTdGF0ZSAgPSAhIXRoaXMub3B0aW9ucy5wdXNoU3RhdGU7XG4gICAgICB0aGlzLl9oYXNQdXNoU3RhdGUgICAgPSAhISh0aGlzLmhpc3RvcnkgJiYgdGhpcy5oaXN0b3J5LnB1c2hTdGF0ZSk7XG4gICAgICB0aGlzLl91c2VQdXNoU3RhdGUgICAgPSB0aGlzLl93YW50c1B1c2hTdGF0ZSAmJiB0aGlzLl9oYXNQdXNoU3RhdGU7XG4gICAgICB0aGlzLmZyYWdtZW50ICAgICAgICAgPSB0aGlzLmdldEZyYWdtZW50KCk7XG5cbiAgICAgIC8vIE5vcm1hbGl6ZSByb290IHRvIGFsd2F5cyBpbmNsdWRlIGEgbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2guXG4gICAgICB0aGlzLnJvb3QgPSAoJy8nICsgdGhpcy5yb290ICsgJy8nKS5yZXBsYWNlKHJvb3RTdHJpcHBlciwgJy8nKTtcblxuICAgICAgLy8gVHJhbnNpdGlvbiBmcm9tIGhhc2hDaGFuZ2UgdG8gcHVzaFN0YXRlIG9yIHZpY2UgdmVyc2EgaWYgYm90aCBhcmVcbiAgICAgIC8vIHJlcXVlc3RlZC5cbiAgICAgIGlmICh0aGlzLl93YW50c0hhc2hDaGFuZ2UgJiYgdGhpcy5fd2FudHNQdXNoU3RhdGUpIHtcblxuICAgICAgICAvLyBJZiB3ZSd2ZSBzdGFydGVkIG9mZiB3aXRoIGEgcm91dGUgZnJvbSBhIGBwdXNoU3RhdGVgLWVuYWJsZWRcbiAgICAgICAgLy8gYnJvd3NlciwgYnV0IHdlJ3JlIGN1cnJlbnRseSBpbiBhIGJyb3dzZXIgdGhhdCBkb2Vzbid0IHN1cHBvcnQgaXQuLi5cbiAgICAgICAgaWYgKCF0aGlzLl9oYXNQdXNoU3RhdGUgJiYgIXRoaXMuYXRSb290KCkpIHtcbiAgICAgICAgICB2YXIgcm9vdCA9IHRoaXMucm9vdC5zbGljZSgwLCAtMSkgfHwgJy8nO1xuICAgICAgICAgIHRoaXMubG9jYXRpb24ucmVwbGFjZShyb290ICsgJyMnICsgdGhpcy5nZXRQYXRoKCkpO1xuICAgICAgICAgIC8vIFJldHVybiBpbW1lZGlhdGVseSBhcyBicm93c2VyIHdpbGwgZG8gcmVkaXJlY3QgdG8gbmV3IHVybFxuICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIC8vIE9yIGlmIHdlJ3ZlIHN0YXJ0ZWQgb3V0IHdpdGggYSBoYXNoLWJhc2VkIHJvdXRlLCBidXQgd2UncmUgY3VycmVudGx5XG4gICAgICAgIC8vIGluIGEgYnJvd3NlciB3aGVyZSBpdCBjb3VsZCBiZSBgcHVzaFN0YXRlYC1iYXNlZCBpbnN0ZWFkLi4uXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faGFzUHVzaFN0YXRlICYmIHRoaXMuYXRSb290KCkpIHtcbiAgICAgICAgICB0aGlzLm5hdmlnYXRlKHRoaXMuZ2V0SGFzaCgpLCB7cmVwbGFjZTogdHJ1ZX0pO1xuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgLy8gUHJveHkgYW4gaWZyYW1lIHRvIGhhbmRsZSBsb2NhdGlvbiBldmVudHMgaWYgdGhlIGJyb3dzZXIgZG9lc24ndFxuICAgICAgLy8gc3VwcG9ydCB0aGUgYGhhc2hjaGFuZ2VgIGV2ZW50LCBIVE1MNSBoaXN0b3J5LCBvciB0aGUgdXNlciB3YW50c1xuICAgICAgLy8gYGhhc2hDaGFuZ2VgIGJ1dCBub3QgYHB1c2hTdGF0ZWAuXG4gICAgICBpZiAoIXRoaXMuX2hhc0hhc2hDaGFuZ2UgJiYgdGhpcy5fd2FudHNIYXNoQ2hhbmdlICYmICF0aGlzLl91c2VQdXNoU3RhdGUpIHtcbiAgICAgICAgdGhpcy5pZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICAgICAgdGhpcy5pZnJhbWUuc3JjID0gJ2phdmFzY3JpcHQ6MCc7XG4gICAgICAgIHRoaXMuaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuaWZyYW1lLnRhYkluZGV4ID0gLTE7XG4gICAgICAgIHZhciBib2R5ID0gZG9jdW1lbnQuYm9keTtcbiAgICAgICAgLy8gVXNpbmcgYGFwcGVuZENoaWxkYCB3aWxsIHRocm93IG9uIElFIDwgOSBpZiB0aGUgZG9jdW1lbnQgaXMgbm90IHJlYWR5LlxuICAgICAgICB2YXIgaVdpbmRvdyA9IGJvZHkuaW5zZXJ0QmVmb3JlKHRoaXMuaWZyYW1lLCBib2R5LmZpcnN0Q2hpbGQpLmNvbnRlbnRXaW5kb3c7XG4gICAgICAgIGlXaW5kb3cuZG9jdW1lbnQub3BlbigpO1xuICAgICAgICBpV2luZG93LmRvY3VtZW50LmNsb3NlKCk7XG4gICAgICAgIGlXaW5kb3cubG9jYXRpb24uaGFzaCA9ICcjJyArIHRoaXMuZnJhZ21lbnQ7XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBhIGNyb3NzLXBsYXRmb3JtIGBhZGRFdmVudExpc3RlbmVyYCBzaGltIGZvciBvbGRlciBicm93c2Vycy5cbiAgICAgIHZhciBhZGRFdmVudExpc3RlbmVyID0gd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgfHwgZnVuY3Rpb24gKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuIGF0dGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIERlcGVuZGluZyBvbiB3aGV0aGVyIHdlJ3JlIHVzaW5nIHB1c2hTdGF0ZSBvciBoYXNoZXMsIGFuZCB3aGV0aGVyXG4gICAgICAvLyAnb25oYXNoY2hhbmdlJyBpcyBzdXBwb3J0ZWQsIGRldGVybWluZSBob3cgd2UgY2hlY2sgdGhlIFVSTCBzdGF0ZS5cbiAgICAgIGlmICh0aGlzLl91c2VQdXNoU3RhdGUpIHtcbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCB0aGlzLmNoZWNrVXJsLCBmYWxzZSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3VzZUhhc2hDaGFuZ2UgJiYgIXRoaXMuaWZyYW1lKSB7XG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCB0aGlzLmNoZWNrVXJsLCBmYWxzZSk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3dhbnRzSGFzaENoYW5nZSkge1xuICAgICAgICB0aGlzLl9jaGVja1VybEludGVydmFsID0gc2V0SW50ZXJ2YWwodGhpcy5jaGVja1VybCwgdGhpcy5pbnRlcnZhbCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5vcHRpb25zLnNpbGVudCkgcmV0dXJuIHRoaXMubG9hZFVybCgpO1xuICAgIH0sXG5cbiAgICAvLyBEaXNhYmxlIEJhY2tib25lLmhpc3RvcnksIHBlcmhhcHMgdGVtcG9yYXJpbHkuIE5vdCB1c2VmdWwgaW4gYSByZWFsIGFwcCxcbiAgICAvLyBidXQgcG9zc2libHkgdXNlZnVsIGZvciB1bml0IHRlc3RpbmcgUm91dGVycy5cbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIEFkZCBhIGNyb3NzLXBsYXRmb3JtIGByZW1vdmVFdmVudExpc3RlbmVyYCBzaGltIGZvciBvbGRlciBicm93c2Vycy5cbiAgICAgIHZhciByZW1vdmVFdmVudExpc3RlbmVyID0gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIgfHwgZnVuY3Rpb24gKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuIGRldGFjaEV2ZW50KCdvbicgKyBldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIFJlbW92ZSB3aW5kb3cgbGlzdGVuZXJzLlxuICAgICAgaWYgKHRoaXMuX3VzZVB1c2hTdGF0ZSkge1xuICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIHRoaXMuY2hlY2tVcmwsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fdXNlSGFzaENoYW5nZSAmJiAhdGhpcy5pZnJhbWUpIHtcbiAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHRoaXMuY2hlY2tVcmwsIGZhbHNlKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2xlYW4gdXAgdGhlIGlmcmFtZSBpZiBuZWNlc3NhcnkuXG4gICAgICBpZiAodGhpcy5pZnJhbWUpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLmlmcmFtZSk7XG4gICAgICAgIHRoaXMuaWZyYW1lID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8gU29tZSBlbnZpcm9ubWVudHMgd2lsbCB0aHJvdyB3aGVuIGNsZWFyaW5nIGFuIHVuZGVmaW5lZCBpbnRlcnZhbC5cbiAgICAgIGlmICh0aGlzLl9jaGVja1VybEludGVydmFsKSBjbGVhckludGVydmFsKHRoaXMuX2NoZWNrVXJsSW50ZXJ2YWwpO1xuICAgICAgSGlzdG9yeS5zdGFydGVkID0gZmFsc2U7XG4gICAgfSxcblxuICAgIC8vIEFkZCBhIHJvdXRlIHRvIGJlIHRlc3RlZCB3aGVuIHRoZSBmcmFnbWVudCBjaGFuZ2VzLiBSb3V0ZXMgYWRkZWQgbGF0ZXJcbiAgICAvLyBtYXkgb3ZlcnJpZGUgcHJldmlvdXMgcm91dGVzLlxuICAgIHJvdXRlOiBmdW5jdGlvbihyb3V0ZSwgY2FsbGJhY2spIHtcbiAgICAgIHRoaXMuaGFuZGxlcnMudW5zaGlmdCh7cm91dGU6IHJvdXRlLCBjYWxsYmFjazogY2FsbGJhY2t9KTtcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2tzIHRoZSBjdXJyZW50IFVSTCB0byBzZWUgaWYgaXQgaGFzIGNoYW5nZWQsIGFuZCBpZiBpdCBoYXMsXG4gICAgLy8gY2FsbHMgYGxvYWRVcmxgLCBub3JtYWxpemluZyBhY3Jvc3MgdGhlIGhpZGRlbiBpZnJhbWUuXG4gICAgY2hlY2tVcmw6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBjdXJyZW50ID0gdGhpcy5nZXRGcmFnbWVudCgpO1xuXG4gICAgICAvLyBJZiB0aGUgdXNlciBwcmVzc2VkIHRoZSBiYWNrIGJ1dHRvbiwgdGhlIGlmcmFtZSdzIGhhc2ggd2lsbCBoYXZlXG4gICAgICAvLyBjaGFuZ2VkIGFuZCB3ZSBzaG91bGQgdXNlIHRoYXQgZm9yIGNvbXBhcmlzb24uXG4gICAgICBpZiAoY3VycmVudCA9PT0gdGhpcy5mcmFnbWVudCAmJiB0aGlzLmlmcmFtZSkge1xuICAgICAgICBjdXJyZW50ID0gdGhpcy5nZXRIYXNoKHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3cpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY3VycmVudCA9PT0gdGhpcy5mcmFnbWVudCkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKHRoaXMuaWZyYW1lKSB0aGlzLm5hdmlnYXRlKGN1cnJlbnQpO1xuICAgICAgdGhpcy5sb2FkVXJsKCk7XG4gICAgfSxcblxuICAgIC8vIEF0dGVtcHQgdG8gbG9hZCB0aGUgY3VycmVudCBVUkwgZnJhZ21lbnQuIElmIGEgcm91dGUgc3VjY2VlZHMgd2l0aCBhXG4gICAgLy8gbWF0Y2gsIHJldHVybnMgYHRydWVgLiBJZiBubyBkZWZpbmVkIHJvdXRlcyBtYXRjaGVzIHRoZSBmcmFnbWVudCxcbiAgICAvLyByZXR1cm5zIGBmYWxzZWAuXG4gICAgbG9hZFVybDogZnVuY3Rpb24oZnJhZ21lbnQpIHtcbiAgICAgIC8vIElmIHRoZSByb290IGRvZXNuJ3QgbWF0Y2gsIG5vIHJvdXRlcyBjYW4gbWF0Y2ggZWl0aGVyLlxuICAgICAgaWYgKCF0aGlzLm1hdGNoUm9vdCgpKSByZXR1cm4gZmFsc2U7XG4gICAgICBmcmFnbWVudCA9IHRoaXMuZnJhZ21lbnQgPSB0aGlzLmdldEZyYWdtZW50KGZyYWdtZW50KTtcbiAgICAgIHJldHVybiBfLnNvbWUodGhpcy5oYW5kbGVycywgZnVuY3Rpb24oaGFuZGxlcikge1xuICAgICAgICBpZiAoaGFuZGxlci5yb3V0ZS50ZXN0KGZyYWdtZW50KSkge1xuICAgICAgICAgIGhhbmRsZXIuY2FsbGJhY2soZnJhZ21lbnQpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gU2F2ZSBhIGZyYWdtZW50IGludG8gdGhlIGhhc2ggaGlzdG9yeSwgb3IgcmVwbGFjZSB0aGUgVVJMIHN0YXRlIGlmIHRoZVxuICAgIC8vICdyZXBsYWNlJyBvcHRpb24gaXMgcGFzc2VkLiBZb3UgYXJlIHJlc3BvbnNpYmxlIGZvciBwcm9wZXJseSBVUkwtZW5jb2RpbmdcbiAgICAvLyB0aGUgZnJhZ21lbnQgaW4gYWR2YW5jZS5cbiAgICAvL1xuICAgIC8vIFRoZSBvcHRpb25zIG9iamVjdCBjYW4gY29udGFpbiBgdHJpZ2dlcjogdHJ1ZWAgaWYgeW91IHdpc2ggdG8gaGF2ZSB0aGVcbiAgICAvLyByb3V0ZSBjYWxsYmFjayBiZSBmaXJlZCAobm90IHVzdWFsbHkgZGVzaXJhYmxlKSwgb3IgYHJlcGxhY2U6IHRydWVgLCBpZlxuICAgIC8vIHlvdSB3aXNoIHRvIG1vZGlmeSB0aGUgY3VycmVudCBVUkwgd2l0aG91dCBhZGRpbmcgYW4gZW50cnkgdG8gdGhlIGhpc3RvcnkuXG4gICAgbmF2aWdhdGU6IGZ1bmN0aW9uKGZyYWdtZW50LCBvcHRpb25zKSB7XG4gICAgICBpZiAoIUhpc3Rvcnkuc3RhcnRlZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKCFvcHRpb25zIHx8IG9wdGlvbnMgPT09IHRydWUpIG9wdGlvbnMgPSB7dHJpZ2dlcjogISFvcHRpb25zfTtcblxuICAgICAgLy8gTm9ybWFsaXplIHRoZSBmcmFnbWVudC5cbiAgICAgIGZyYWdtZW50ID0gdGhpcy5nZXRGcmFnbWVudChmcmFnbWVudCB8fCAnJyk7XG5cbiAgICAgIC8vIERvbid0IGluY2x1ZGUgYSB0cmFpbGluZyBzbGFzaCBvbiB0aGUgcm9vdC5cbiAgICAgIHZhciByb290ID0gdGhpcy5yb290O1xuICAgICAgaWYgKGZyYWdtZW50ID09PSAnJyB8fCBmcmFnbWVudC5jaGFyQXQoMCkgPT09ICc/Jykge1xuICAgICAgICByb290ID0gcm9vdC5zbGljZSgwLCAtMSkgfHwgJy8nO1xuICAgICAgfVxuICAgICAgdmFyIHVybCA9IHJvb3QgKyBmcmFnbWVudDtcblxuICAgICAgLy8gU3RyaXAgdGhlIGhhc2ggYW5kIGRlY29kZSBmb3IgbWF0Y2hpbmcuXG4gICAgICBmcmFnbWVudCA9IHRoaXMuZGVjb2RlRnJhZ21lbnQoZnJhZ21lbnQucmVwbGFjZShwYXRoU3RyaXBwZXIsICcnKSk7XG5cbiAgICAgIGlmICh0aGlzLmZyYWdtZW50ID09PSBmcmFnbWVudCkgcmV0dXJuO1xuICAgICAgdGhpcy5mcmFnbWVudCA9IGZyYWdtZW50O1xuXG4gICAgICAvLyBJZiBwdXNoU3RhdGUgaXMgYXZhaWxhYmxlLCB3ZSB1c2UgaXQgdG8gc2V0IHRoZSBmcmFnbWVudCBhcyBhIHJlYWwgVVJMLlxuICAgICAgaWYgKHRoaXMuX3VzZVB1c2hTdGF0ZSkge1xuICAgICAgICB0aGlzLmhpc3Rvcnlbb3B0aW9ucy5yZXBsYWNlID8gJ3JlcGxhY2VTdGF0ZScgOiAncHVzaFN0YXRlJ10oe30sIGRvY3VtZW50LnRpdGxlLCB1cmwpO1xuXG4gICAgICAvLyBJZiBoYXNoIGNoYW5nZXMgaGF2ZW4ndCBiZWVuIGV4cGxpY2l0bHkgZGlzYWJsZWQsIHVwZGF0ZSB0aGUgaGFzaFxuICAgICAgLy8gZnJhZ21lbnQgdG8gc3RvcmUgaGlzdG9yeS5cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fd2FudHNIYXNoQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUhhc2godGhpcy5sb2NhdGlvbiwgZnJhZ21lbnQsIG9wdGlvbnMucmVwbGFjZSk7XG4gICAgICAgIGlmICh0aGlzLmlmcmFtZSAmJiAoZnJhZ21lbnQgIT09IHRoaXMuZ2V0SGFzaCh0aGlzLmlmcmFtZS5jb250ZW50V2luZG93KSkpIHtcbiAgICAgICAgICB2YXIgaVdpbmRvdyA9IHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3c7XG5cbiAgICAgICAgICAvLyBPcGVuaW5nIGFuZCBjbG9zaW5nIHRoZSBpZnJhbWUgdHJpY2tzIElFNyBhbmQgZWFybGllciB0byBwdXNoIGFcbiAgICAgICAgICAvLyBoaXN0b3J5IGVudHJ5IG9uIGhhc2gtdGFnIGNoYW5nZS4gIFdoZW4gcmVwbGFjZSBpcyB0cnVlLCB3ZSBkb24ndFxuICAgICAgICAgIC8vIHdhbnQgdGhpcy5cbiAgICAgICAgICBpZiAoIW9wdGlvbnMucmVwbGFjZSkge1xuICAgICAgICAgICAgaVdpbmRvdy5kb2N1bWVudC5vcGVuKCk7XG4gICAgICAgICAgICBpV2luZG93LmRvY3VtZW50LmNsb3NlKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5fdXBkYXRlSGFzaChpV2luZG93LmxvY2F0aW9uLCBmcmFnbWVudCwgb3B0aW9ucy5yZXBsYWNlKTtcbiAgICAgICAgfVxuXG4gICAgICAvLyBJZiB5b3UndmUgdG9sZCB1cyB0aGF0IHlvdSBleHBsaWNpdGx5IGRvbid0IHdhbnQgZmFsbGJhY2sgaGFzaGNoYW5nZS1cbiAgICAgIC8vIGJhc2VkIGhpc3RvcnksIHRoZW4gYG5hdmlnYXRlYCBiZWNvbWVzIGEgcGFnZSByZWZyZXNoLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYXRpb24uYXNzaWduKHVybCk7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy50cmlnZ2VyKSByZXR1cm4gdGhpcy5sb2FkVXJsKGZyYWdtZW50KTtcbiAgICB9LFxuXG4gICAgLy8gVXBkYXRlIHRoZSBoYXNoIGxvY2F0aW9uLCBlaXRoZXIgcmVwbGFjaW5nIHRoZSBjdXJyZW50IGVudHJ5LCBvciBhZGRpbmdcbiAgICAvLyBhIG5ldyBvbmUgdG8gdGhlIGJyb3dzZXIgaGlzdG9yeS5cbiAgICBfdXBkYXRlSGFzaDogZnVuY3Rpb24obG9jYXRpb24sIGZyYWdtZW50LCByZXBsYWNlKSB7XG4gICAgICBpZiAocmVwbGFjZSkge1xuICAgICAgICB2YXIgaHJlZiA9IGxvY2F0aW9uLmhyZWYucmVwbGFjZSgvKGphdmFzY3JpcHQ6fCMpLiokLywgJycpO1xuICAgICAgICBsb2NhdGlvbi5yZXBsYWNlKGhyZWYgKyAnIycgKyBmcmFnbWVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTb21lIGJyb3dzZXJzIHJlcXVpcmUgdGhhdCBgaGFzaGAgY29udGFpbnMgYSBsZWFkaW5nICMuXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIycgKyBmcmFnbWVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgfSk7XG5cbiAgLy8gQ3JlYXRlIHRoZSBkZWZhdWx0IEJhY2tib25lLmhpc3RvcnkuXG4gIEJhY2tib25lLmhpc3RvcnkgPSBuZXcgSGlzdG9yeTtcblxuICAvLyBIZWxwZXJzXG4gIC8vIC0tLS0tLS1cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29ycmVjdGx5IHNldCB1cCB0aGUgcHJvdG90eXBlIGNoYWluIGZvciBzdWJjbGFzc2VzLlxuICAvLyBTaW1pbGFyIHRvIGBnb29nLmluaGVyaXRzYCwgYnV0IHVzZXMgYSBoYXNoIG9mIHByb3RvdHlwZSBwcm9wZXJ0aWVzIGFuZFxuICAvLyBjbGFzcyBwcm9wZXJ0aWVzIHRvIGJlIGV4dGVuZGVkLlxuICB2YXIgZXh0ZW5kID0gZnVuY3Rpb24ocHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICB2YXIgcGFyZW50ID0gdGhpcztcbiAgICB2YXIgY2hpbGQ7XG5cbiAgICAvLyBUaGUgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBuZXcgc3ViY2xhc3MgaXMgZWl0aGVyIGRlZmluZWQgYnkgeW91XG4gICAgLy8gKHRoZSBcImNvbnN0cnVjdG9yXCIgcHJvcGVydHkgaW4geW91ciBgZXh0ZW5kYCBkZWZpbml0aW9uKSwgb3IgZGVmYXVsdGVkXG4gICAgLy8gYnkgdXMgdG8gc2ltcGx5IGNhbGwgdGhlIHBhcmVudCBjb25zdHJ1Y3Rvci5cbiAgICBpZiAocHJvdG9Qcm9wcyAmJiBfLmhhcyhwcm90b1Byb3BzLCAnY29uc3RydWN0b3InKSkge1xuICAgICAgY2hpbGQgPSBwcm90b1Byb3BzLmNvbnN0cnVjdG9yO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaGlsZCA9IGZ1bmN0aW9uKCl7IHJldHVybiBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfTtcbiAgICB9XG5cbiAgICAvLyBBZGQgc3RhdGljIHByb3BlcnRpZXMgdG8gdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLCBpZiBzdXBwbGllZC5cbiAgICBfLmV4dGVuZChjaGlsZCwgcGFyZW50LCBzdGF0aWNQcm9wcyk7XG5cbiAgICAvLyBTZXQgdGhlIHByb3RvdHlwZSBjaGFpbiB0byBpbmhlcml0IGZyb20gYHBhcmVudGAsIHdpdGhvdXQgY2FsbGluZ1xuICAgIC8vIGBwYXJlbnRgIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLlxuICAgIHZhciBTdXJyb2dhdGUgPSBmdW5jdGlvbigpeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH07XG4gICAgU3Vycm9nYXRlLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7XG4gICAgY2hpbGQucHJvdG90eXBlID0gbmV3IFN1cnJvZ2F0ZTtcblxuICAgIC8vIEFkZCBwcm90b3R5cGUgcHJvcGVydGllcyAoaW5zdGFuY2UgcHJvcGVydGllcykgdG8gdGhlIHN1YmNsYXNzLFxuICAgIC8vIGlmIHN1cHBsaWVkLlxuICAgIGlmIChwcm90b1Byb3BzKSBfLmV4dGVuZChjaGlsZC5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuXG4gICAgLy8gU2V0IGEgY29udmVuaWVuY2UgcHJvcGVydHkgaW4gY2FzZSB0aGUgcGFyZW50J3MgcHJvdG90eXBlIGlzIG5lZWRlZFxuICAgIC8vIGxhdGVyLlxuICAgIGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG4gIH07XG5cbiAgLy8gU2V0IHVwIGluaGVyaXRhbmNlIGZvciB0aGUgbW9kZWwsIGNvbGxlY3Rpb24sIHJvdXRlciwgdmlldyBhbmQgaGlzdG9yeS5cbiAgTW9kZWwuZXh0ZW5kID0gQ29sbGVjdGlvbi5leHRlbmQgPSBSb3V0ZXIuZXh0ZW5kID0gVmlldy5leHRlbmQgPSBIaXN0b3J5LmV4dGVuZCA9IGV4dGVuZDtcblxuICAvLyBUaHJvdyBhbiBlcnJvciB3aGVuIGEgVVJMIGlzIG5lZWRlZCwgYW5kIG5vbmUgaXMgc3VwcGxpZWQuXG4gIHZhciB1cmxFcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQSBcInVybFwiIHByb3BlcnR5IG9yIGZ1bmN0aW9uIG11c3QgYmUgc3BlY2lmaWVkJyk7XG4gIH07XG5cbiAgLy8gV3JhcCBhbiBvcHRpb25hbCBlcnJvciBjYWxsYmFjayB3aXRoIGEgZmFsbGJhY2sgZXJyb3IgZXZlbnQuXG4gIHZhciB3cmFwRXJyb3IgPSBmdW5jdGlvbihtb2RlbCwgb3B0aW9ucykge1xuICAgIHZhciBlcnJvciA9IG9wdGlvbnMuZXJyb3I7XG4gICAgb3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgIGlmIChlcnJvcikgZXJyb3IuY2FsbChvcHRpb25zLmNvbnRleHQsIG1vZGVsLCByZXNwLCBvcHRpb25zKTtcbiAgICAgIG1vZGVsLnRyaWdnZXIoJ2Vycm9yJywgbW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgIH07XG4gIH07XG5cbiAgcmV0dXJuIEJhY2tib25lO1xuXG59KSk7Il0sImZpbGUiOiJsaWIvYmFja2JvbmUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
