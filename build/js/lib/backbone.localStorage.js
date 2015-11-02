/**
 * Backbone localStorage Adapter
 * Version 1.1.16
 *
 * https://github.com/jeromegn/Backbone.localStorage
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof require === 'function') {
    module.exports = factory(require("backbone"));
  } else if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["backbone"], function(Backbone) {
      // Use global variables if the locals are undefined.
      return factory(Backbone || root.Backbone);
    });
  } else {
    factory(Backbone);
  }
}(this, function(Backbone) {
// A simple module to replace `Backbone.sync` with *localStorage*-based
// persistence. Models are given GUIDS, and saved into a JSON object. Simple
// as that.

// Generate four random hex digits.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

function isObject(item) {
  return item === Object(item);
}

function contains(array, item) {
  var i = array.length;
  while (i--) if (array[i] === item) return true;
  return false;
}

function extend(obj, props) {
  for (var key in props) obj[key] = props[key]
  return obj;
}

function result(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return (typeof value === 'function') ? object[property]() : value;
}

// Our Store is represented by a single JS object in *localStorage*. Create it
// with a meaningful name, like the name you'd give a table.
// window.Store is deprectated, use Backbone.LocalStorage instead
Backbone.LocalStorage = window.Store = function(name, serializer) {
  if( !this.localStorage ) {
    throw "Backbone.localStorage: Environment does not support localStorage."
  }
  this.name = name;
  this.serializer = serializer || {
    serialize: function(item) {
      return isObject(item) ? JSON.stringify(item) : item;
    },
    // fix for "illegal access" error on Android when JSON.parse is passed null
    deserialize: function (data) {
      return data && JSON.parse(data);
    }
  };
  var store = this.localStorage().getItem(this.name);
  this.records = (store && store.split(",")) || [];
};

extend(Backbone.LocalStorage.prototype, {

  // Save the current state of the **Store** to *localStorage*.
  save: function() {
    this.localStorage().setItem(this.name, this.records.join(","));
  },

  // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
  // have an id of it's own.
  create: function(model) {
    if (!model.id && model.id !== 0) {
      model.id = guid();
      model.set(model.idAttribute, model.id);
    }
    this.localStorage().setItem(this._itemName(model.id), this.serializer.serialize(model));
    this.records.push(model.id.toString());
    this.save();
    return this.find(model);
  },

  // Update a model by replacing its copy in `this.data`.
  update: function(model) {
    this.localStorage().setItem(this._itemName(model.id), this.serializer.serialize(model));
    var modelId = model.id.toString();
    if (!contains(this.records, modelId)) {
      this.records.push(modelId);
      this.save();
    }
    return this.find(model);
  },

  // Retrieve a model from `this.data` by id.
  find: function(model) {
    return this.serializer.deserialize(this.localStorage().getItem(this._itemName(model.id)));
  },

  // Return the array of all models currently in storage.
  findAll: function() {
    var result = [];
    for (var i = 0, id, data; i < this.records.length; i++) {
      id = this.records[i];
      data = this.serializer.deserialize(this.localStorage().getItem(this._itemName(id)));
      if (data != null) result.push(data);
    }
    return result;
  },

  // Delete a model from `this.data`, returning it.
  destroy: function(model) {
    this.localStorage().removeItem(this._itemName(model.id));
    var modelId = model.id.toString();
    for (var i = 0, id; i < this.records.length; i++) {
      if (this.records[i] === modelId) {
        this.records.splice(i, 1);
      }
    }
    this.save();
    return model;
  },

  localStorage: function() {
    return localStorage;
  },

  // Clear localStorage for specific collection.
  _clear: function() {
    var local = this.localStorage(),
      itemRe = new RegExp("^" + this.name + "-");

    // Remove id-tracking item (e.g., "foo").
    local.removeItem(this.name);

    // Match all data items (e.g., "foo-ID") and remove.
    for (var k in local) {
      if (itemRe.test(k)) {
        local.removeItem(k);
      }
    }

    this.records.length = 0;
  },

  // Size of localStorage.
  _storageSize: function() {
    return this.localStorage().length;
  },

  _itemName: function(id) {
    return this.name+"-"+id;
  }

});

// localSync delegate to the model or collection's
// *localStorage* property, which should be an instance of `Store`.
// window.Store.sync and Backbone.localSync is deprecated, use Backbone.LocalStorage.sync instead
Backbone.LocalStorage.sync = window.Store.sync = Backbone.localSync = function(method, model, options) {
  var store = result(model, 'localStorage') || result(model.collection, 'localStorage');

  var resp, errorMessage;
  //If $ is having Deferred - use it.
  var syncDfd = Backbone.$ ?
    (Backbone.$.Deferred && Backbone.$.Deferred()) :
    (Backbone.Deferred && Backbone.Deferred());

  try {

    switch (method) {
      case "read":
        resp = model.id != undefined ? store.find(model) : store.findAll();
        break;
      case "create":
        resp = store.create(model);
        break;
      case "update":
        resp = store.update(model);
        break;
      case "delete":
        resp = store.destroy(model);
        break;
    }

  } catch(error) {
    if (error.code === 22 && store._storageSize() === 0)
      errorMessage = "Private browsing is unsupported";
    else
      errorMessage = error.message;
  }

  if (resp) {
    if (options && options.success) {
      if (Backbone.VERSION === "0.9.10") {
        options.success(model, resp, options);
      } else {
        options.success(resp);
      }
    }
    if (syncDfd) {
      syncDfd.resolve(resp);
    }

  } else {
    errorMessage = errorMessage ? errorMessage
                                : "Record Not Found";

    if (options && options.error)
      if (Backbone.VERSION === "0.9.10") {
        options.error(model, errorMessage, options);
      } else {
        options.error(errorMessage);
      }

    if (syncDfd)
      syncDfd.reject(errorMessage);
  }

  // add compatibility with $.ajax
  // always execute callback for success and error
  if (options && options.complete) options.complete(resp);

  return syncDfd && syncDfd.promise();
};

Backbone.ajaxSync = Backbone.sync;

Backbone.getSyncMethod = function(model, options) {
  var forceAjaxSync = options && options.ajaxSync;

  if(!forceAjaxSync && (result(model, 'localStorage') || result(model.collection, 'localStorage'))) {
    return Backbone.localSync;
  }

  return Backbone.ajaxSync;
};

// Override 'Backbone.sync' to default to localSync,
// the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
Backbone.sync = function(method, model, options) {
  return Backbone.getSyncMethod(model, options).apply(this, [method, model, options]);
};

return Backbone.LocalStorage;
}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsaWIvYmFja2JvbmUubG9jYWxTdG9yYWdlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQmFja2JvbmUgbG9jYWxTdG9yYWdlIEFkYXB0ZXJcbiAqIFZlcnNpb24gMS4xLjE2XG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL2plcm9tZWduL0JhY2tib25lLmxvY2FsU3RvcmFnZVxuICovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKFwiYmFja2JvbmVcIikpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgIGRlZmluZShbXCJiYWNrYm9uZVwiXSwgZnVuY3Rpb24oQmFja2JvbmUpIHtcbiAgICAgIC8vIFVzZSBnbG9iYWwgdmFyaWFibGVzIGlmIHRoZSBsb2NhbHMgYXJlIHVuZGVmaW5lZC5cbiAgICAgIHJldHVybiBmYWN0b3J5KEJhY2tib25lIHx8IHJvb3QuQmFja2JvbmUpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGZhY3RvcnkoQmFja2JvbmUpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uKEJhY2tib25lKSB7XG4vLyBBIHNpbXBsZSBtb2R1bGUgdG8gcmVwbGFjZSBgQmFja2JvbmUuc3luY2Agd2l0aCAqbG9jYWxTdG9yYWdlKi1iYXNlZFxuLy8gcGVyc2lzdGVuY2UuIE1vZGVscyBhcmUgZ2l2ZW4gR1VJRFMsIGFuZCBzYXZlZCBpbnRvIGEgSlNPTiBvYmplY3QuIFNpbXBsZVxuLy8gYXMgdGhhdC5cblxuLy8gR2VuZXJhdGUgZm91ciByYW5kb20gaGV4IGRpZ2l0cy5cbmZ1bmN0aW9uIFM0KCkge1xuICAgcmV0dXJuICgoKDErTWF0aC5yYW5kb20oKSkqMHgxMDAwMCl8MCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcbn07XG5cbi8vIEdlbmVyYXRlIGEgcHNldWRvLUdVSUQgYnkgY29uY2F0ZW5hdGluZyByYW5kb20gaGV4YWRlY2ltYWwuXG5mdW5jdGlvbiBndWlkKCkge1xuICAgcmV0dXJuIChTNCgpK1M0KCkrXCItXCIrUzQoKStcIi1cIitTNCgpK1wiLVwiK1M0KCkrXCItXCIrUzQoKStTNCgpK1M0KCkpO1xufTtcblxuZnVuY3Rpb24gaXNPYmplY3QoaXRlbSkge1xuICByZXR1cm4gaXRlbSA9PT0gT2JqZWN0KGl0ZW0pO1xufVxuXG5mdW5jdGlvbiBjb250YWlucyhhcnJheSwgaXRlbSkge1xuICB2YXIgaSA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKGktLSkgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBleHRlbmQob2JqLCBwcm9wcykge1xuICBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIG9ialtrZXldID0gcHJvcHNba2V5XVxuICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiByZXN1bHQob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICB2YXIgdmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuICAgIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSA/IG9iamVjdFtwcm9wZXJ0eV0oKSA6IHZhbHVlO1xufVxuXG4vLyBPdXIgU3RvcmUgaXMgcmVwcmVzZW50ZWQgYnkgYSBzaW5nbGUgSlMgb2JqZWN0IGluICpsb2NhbFN0b3JhZ2UqLiBDcmVhdGUgaXRcbi8vIHdpdGggYSBtZWFuaW5nZnVsIG5hbWUsIGxpa2UgdGhlIG5hbWUgeW91J2QgZ2l2ZSBhIHRhYmxlLlxuLy8gd2luZG93LlN0b3JlIGlzIGRlcHJlY3RhdGVkLCB1c2UgQmFja2JvbmUuTG9jYWxTdG9yYWdlIGluc3RlYWRcbkJhY2tib25lLkxvY2FsU3RvcmFnZSA9IHdpbmRvdy5TdG9yZSA9IGZ1bmN0aW9uKG5hbWUsIHNlcmlhbGl6ZXIpIHtcbiAgaWYoICF0aGlzLmxvY2FsU3RvcmFnZSApIHtcbiAgICB0aHJvdyBcIkJhY2tib25lLmxvY2FsU3RvcmFnZTogRW52aXJvbm1lbnQgZG9lcyBub3Qgc3VwcG9ydCBsb2NhbFN0b3JhZ2UuXCJcbiAgfVxuICB0aGlzLm5hbWUgPSBuYW1lO1xuICB0aGlzLnNlcmlhbGl6ZXIgPSBzZXJpYWxpemVyIHx8IHtcbiAgICBzZXJpYWxpemU6IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBpc09iamVjdChpdGVtKSA/IEpTT04uc3RyaW5naWZ5KGl0ZW0pIDogaXRlbTtcbiAgICB9LFxuICAgIC8vIGZpeCBmb3IgXCJpbGxlZ2FsIGFjY2Vzc1wiIGVycm9yIG9uIEFuZHJvaWQgd2hlbiBKU09OLnBhcnNlIGlzIHBhc3NlZCBudWxsXG4gICAgZGVzZXJpYWxpemU6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICByZXR1cm4gZGF0YSAmJiBKU09OLnBhcnNlKGRhdGEpO1xuICAgIH1cbiAgfTtcbiAgdmFyIHN0b3JlID0gdGhpcy5sb2NhbFN0b3JhZ2UoKS5nZXRJdGVtKHRoaXMubmFtZSk7XG4gIHRoaXMucmVjb3JkcyA9IChzdG9yZSAmJiBzdG9yZS5zcGxpdChcIixcIikpIHx8IFtdO1xufTtcblxuZXh0ZW5kKEJhY2tib25lLkxvY2FsU3RvcmFnZS5wcm90b3R5cGUsIHtcblxuICAvLyBTYXZlIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSAqKlN0b3JlKiogdG8gKmxvY2FsU3RvcmFnZSouXG4gIHNhdmU6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMubG9jYWxTdG9yYWdlKCkuc2V0SXRlbSh0aGlzLm5hbWUsIHRoaXMucmVjb3Jkcy5qb2luKFwiLFwiKSk7XG4gIH0sXG5cbiAgLy8gQWRkIGEgbW9kZWwsIGdpdmluZyBpdCBhIChob3BlZnVsbHkpLXVuaXF1ZSBHVUlELCBpZiBpdCBkb2Vzbid0IGFscmVhZHlcbiAgLy8gaGF2ZSBhbiBpZCBvZiBpdCdzIG93bi5cbiAgY3JlYXRlOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIGlmICghbW9kZWwuaWQgJiYgbW9kZWwuaWQgIT09IDApIHtcbiAgICAgIG1vZGVsLmlkID0gZ3VpZCgpO1xuICAgICAgbW9kZWwuc2V0KG1vZGVsLmlkQXR0cmlidXRlLCBtb2RlbC5pZCk7XG4gICAgfVxuICAgIHRoaXMubG9jYWxTdG9yYWdlKCkuc2V0SXRlbSh0aGlzLl9pdGVtTmFtZShtb2RlbC5pZCksIHRoaXMuc2VyaWFsaXplci5zZXJpYWxpemUobW9kZWwpKTtcbiAgICB0aGlzLnJlY29yZHMucHVzaChtb2RlbC5pZC50b1N0cmluZygpKTtcbiAgICB0aGlzLnNhdmUoKTtcbiAgICByZXR1cm4gdGhpcy5maW5kKG1vZGVsKTtcbiAgfSxcblxuICAvLyBVcGRhdGUgYSBtb2RlbCBieSByZXBsYWNpbmcgaXRzIGNvcHkgaW4gYHRoaXMuZGF0YWAuXG4gIHVwZGF0ZTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLmxvY2FsU3RvcmFnZSgpLnNldEl0ZW0odGhpcy5faXRlbU5hbWUobW9kZWwuaWQpLCB0aGlzLnNlcmlhbGl6ZXIuc2VyaWFsaXplKG1vZGVsKSk7XG4gICAgdmFyIG1vZGVsSWQgPSBtb2RlbC5pZC50b1N0cmluZygpO1xuICAgIGlmICghY29udGFpbnModGhpcy5yZWNvcmRzLCBtb2RlbElkKSkge1xuICAgICAgdGhpcy5yZWNvcmRzLnB1c2gobW9kZWxJZCk7XG4gICAgICB0aGlzLnNhdmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZmluZChtb2RlbCk7XG4gIH0sXG5cbiAgLy8gUmV0cmlldmUgYSBtb2RlbCBmcm9tIGB0aGlzLmRhdGFgIGJ5IGlkLlxuICBmaW5kOiBmdW5jdGlvbihtb2RlbCkge1xuICAgIHJldHVybiB0aGlzLnNlcmlhbGl6ZXIuZGVzZXJpYWxpemUodGhpcy5sb2NhbFN0b3JhZ2UoKS5nZXRJdGVtKHRoaXMuX2l0ZW1OYW1lKG1vZGVsLmlkKSkpO1xuICB9LFxuXG4gIC8vIFJldHVybiB0aGUgYXJyYXkgb2YgYWxsIG1vZGVscyBjdXJyZW50bHkgaW4gc3RvcmFnZS5cbiAgZmluZEFsbDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBpZCwgZGF0YTsgaSA8IHRoaXMucmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWQgPSB0aGlzLnJlY29yZHNbaV07XG4gICAgICBkYXRhID0gdGhpcy5zZXJpYWxpemVyLmRlc2VyaWFsaXplKHRoaXMubG9jYWxTdG9yYWdlKCkuZ2V0SXRlbSh0aGlzLl9pdGVtTmFtZShpZCkpKTtcbiAgICAgIGlmIChkYXRhICE9IG51bGwpIHJlc3VsdC5wdXNoKGRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG4gIC8vIERlbGV0ZSBhIG1vZGVsIGZyb20gYHRoaXMuZGF0YWAsIHJldHVybmluZyBpdC5cbiAgZGVzdHJveTogZnVuY3Rpb24obW9kZWwpIHtcbiAgICB0aGlzLmxvY2FsU3RvcmFnZSgpLnJlbW92ZUl0ZW0odGhpcy5faXRlbU5hbWUobW9kZWwuaWQpKTtcbiAgICB2YXIgbW9kZWxJZCA9IG1vZGVsLmlkLnRvU3RyaW5nKCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlkOyBpIDwgdGhpcy5yZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5yZWNvcmRzW2ldID09PSBtb2RlbElkKSB7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5zcGxpY2UoaSwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2F2ZSgpO1xuICAgIHJldHVybiBtb2RlbDtcbiAgfSxcblxuICBsb2NhbFN0b3JhZ2U6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBsb2NhbFN0b3JhZ2U7XG4gIH0sXG5cbiAgLy8gQ2xlYXIgbG9jYWxTdG9yYWdlIGZvciBzcGVjaWZpYyBjb2xsZWN0aW9uLlxuICBfY2xlYXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsb2NhbCA9IHRoaXMubG9jYWxTdG9yYWdlKCksXG4gICAgICBpdGVtUmUgPSBuZXcgUmVnRXhwKFwiXlwiICsgdGhpcy5uYW1lICsgXCItXCIpO1xuXG4gICAgLy8gUmVtb3ZlIGlkLXRyYWNraW5nIGl0ZW0gKGUuZy4sIFwiZm9vXCIpLlxuICAgIGxvY2FsLnJlbW92ZUl0ZW0odGhpcy5uYW1lKTtcblxuICAgIC8vIE1hdGNoIGFsbCBkYXRhIGl0ZW1zIChlLmcuLCBcImZvby1JRFwiKSBhbmQgcmVtb3ZlLlxuICAgIGZvciAodmFyIGsgaW4gbG9jYWwpIHtcbiAgICAgIGlmIChpdGVtUmUudGVzdChrKSkge1xuICAgICAgICBsb2NhbC5yZW1vdmVJdGVtKGspO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucmVjb3Jkcy5sZW5ndGggPSAwO1xuICB9LFxuXG4gIC8vIFNpemUgb2YgbG9jYWxTdG9yYWdlLlxuICBfc3RvcmFnZVNpemU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmxvY2FsU3RvcmFnZSgpLmxlbmd0aDtcbiAgfSxcblxuICBfaXRlbU5hbWU6IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuIHRoaXMubmFtZStcIi1cIitpZDtcbiAgfVxuXG59KTtcblxuLy8gbG9jYWxTeW5jIGRlbGVnYXRlIHRvIHRoZSBtb2RlbCBvciBjb2xsZWN0aW9uJ3Ncbi8vICpsb2NhbFN0b3JhZ2UqIHByb3BlcnR5LCB3aGljaCBzaG91bGQgYmUgYW4gaW5zdGFuY2Ugb2YgYFN0b3JlYC5cbi8vIHdpbmRvdy5TdG9yZS5zeW5jIGFuZCBCYWNrYm9uZS5sb2NhbFN5bmMgaXMgZGVwcmVjYXRlZCwgdXNlIEJhY2tib25lLkxvY2FsU3RvcmFnZS5zeW5jIGluc3RlYWRcbkJhY2tib25lLkxvY2FsU3RvcmFnZS5zeW5jID0gd2luZG93LlN0b3JlLnN5bmMgPSBCYWNrYm9uZS5sb2NhbFN5bmMgPSBmdW5jdGlvbihtZXRob2QsIG1vZGVsLCBvcHRpb25zKSB7XG4gIHZhciBzdG9yZSA9IHJlc3VsdChtb2RlbCwgJ2xvY2FsU3RvcmFnZScpIHx8IHJlc3VsdChtb2RlbC5jb2xsZWN0aW9uLCAnbG9jYWxTdG9yYWdlJyk7XG5cbiAgdmFyIHJlc3AsIGVycm9yTWVzc2FnZTtcbiAgLy9JZiAkIGlzIGhhdmluZyBEZWZlcnJlZCAtIHVzZSBpdC5cbiAgdmFyIHN5bmNEZmQgPSBCYWNrYm9uZS4kID9cbiAgICAoQmFja2JvbmUuJC5EZWZlcnJlZCAmJiBCYWNrYm9uZS4kLkRlZmVycmVkKCkpIDpcbiAgICAoQmFja2JvbmUuRGVmZXJyZWQgJiYgQmFja2JvbmUuRGVmZXJyZWQoKSk7XG5cbiAgdHJ5IHtcblxuICAgIHN3aXRjaCAobWV0aG9kKSB7XG4gICAgICBjYXNlIFwicmVhZFwiOlxuICAgICAgICByZXNwID0gbW9kZWwuaWQgIT0gdW5kZWZpbmVkID8gc3RvcmUuZmluZChtb2RlbCkgOiBzdG9yZS5maW5kQWxsKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImNyZWF0ZVwiOlxuICAgICAgICByZXNwID0gc3RvcmUuY3JlYXRlKG1vZGVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwidXBkYXRlXCI6XG4gICAgICAgIHJlc3AgPSBzdG9yZS51cGRhdGUobW9kZWwpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJkZWxldGVcIjpcbiAgICAgICAgcmVzcCA9IHN0b3JlLmRlc3Ryb3kobW9kZWwpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgfSBjYXRjaChlcnJvcikge1xuICAgIGlmIChlcnJvci5jb2RlID09PSAyMiAmJiBzdG9yZS5fc3RvcmFnZVNpemUoKSA9PT0gMClcbiAgICAgIGVycm9yTWVzc2FnZSA9IFwiUHJpdmF0ZSBicm93c2luZyBpcyB1bnN1cHBvcnRlZFwiO1xuICAgIGVsc2VcbiAgICAgIGVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gIH1cblxuICBpZiAocmVzcCkge1xuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuc3VjY2Vzcykge1xuICAgICAgaWYgKEJhY2tib25lLlZFUlNJT04gPT09IFwiMC45LjEwXCIpIHtcbiAgICAgICAgb3B0aW9ucy5zdWNjZXNzKG1vZGVsLCByZXNwLCBvcHRpb25zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdGlvbnMuc3VjY2VzcyhyZXNwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN5bmNEZmQpIHtcbiAgICAgIHN5bmNEZmQucmVzb2x2ZShyZXNwKTtcbiAgICB9XG5cbiAgfSBlbHNlIHtcbiAgICBlcnJvck1lc3NhZ2UgPSBlcnJvck1lc3NhZ2UgPyBlcnJvck1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBcIlJlY29yZCBOb3QgRm91bmRcIjtcblxuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZXJyb3IpXG4gICAgICBpZiAoQmFja2JvbmUuVkVSU0lPTiA9PT0gXCIwLjkuMTBcIikge1xuICAgICAgICBvcHRpb25zLmVycm9yKG1vZGVsLCBlcnJvck1lc3NhZ2UsIG9wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9ucy5lcnJvcihlcnJvck1lc3NhZ2UpO1xuICAgICAgfVxuXG4gICAgaWYgKHN5bmNEZmQpXG4gICAgICBzeW5jRGZkLnJlamVjdChlcnJvck1lc3NhZ2UpO1xuICB9XG5cbiAgLy8gYWRkIGNvbXBhdGliaWxpdHkgd2l0aCAkLmFqYXhcbiAgLy8gYWx3YXlzIGV4ZWN1dGUgY2FsbGJhY2sgZm9yIHN1Y2Nlc3MgYW5kIGVycm9yXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuY29tcGxldGUpIG9wdGlvbnMuY29tcGxldGUocmVzcCk7XG5cbiAgcmV0dXJuIHN5bmNEZmQgJiYgc3luY0RmZC5wcm9taXNlKCk7XG59O1xuXG5CYWNrYm9uZS5hamF4U3luYyA9IEJhY2tib25lLnN5bmM7XG5cbkJhY2tib25lLmdldFN5bmNNZXRob2QgPSBmdW5jdGlvbihtb2RlbCwgb3B0aW9ucykge1xuICB2YXIgZm9yY2VBamF4U3luYyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5hamF4U3luYztcblxuICBpZighZm9yY2VBamF4U3luYyAmJiAocmVzdWx0KG1vZGVsLCAnbG9jYWxTdG9yYWdlJykgfHwgcmVzdWx0KG1vZGVsLmNvbGxlY3Rpb24sICdsb2NhbFN0b3JhZ2UnKSkpIHtcbiAgICByZXR1cm4gQmFja2JvbmUubG9jYWxTeW5jO1xuICB9XG5cbiAgcmV0dXJuIEJhY2tib25lLmFqYXhTeW5jO1xufTtcblxuLy8gT3ZlcnJpZGUgJ0JhY2tib25lLnN5bmMnIHRvIGRlZmF1bHQgdG8gbG9jYWxTeW5jLFxuLy8gdGhlIG9yaWdpbmFsICdCYWNrYm9uZS5zeW5jJyBpcyBzdGlsbCBhdmFpbGFibGUgaW4gJ0JhY2tib25lLmFqYXhTeW5jJ1xuQmFja2JvbmUuc3luYyA9IGZ1bmN0aW9uKG1ldGhvZCwgbW9kZWwsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIEJhY2tib25lLmdldFN5bmNNZXRob2QobW9kZWwsIG9wdGlvbnMpLmFwcGx5KHRoaXMsIFttZXRob2QsIG1vZGVsLCBvcHRpb25zXSk7XG59O1xuXG5yZXR1cm4gQmFja2JvbmUuTG9jYWxTdG9yYWdlO1xufSkpOyJdLCJmaWxlIjoibGliL2JhY2tib25lLmxvY2FsU3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
