
'use strict';

define([
    'backbone',
    "views/app",
    'router',
    'collection/notes'],

    function(Backbone, AppView, Router, NoteCollection){
           
        var initialize = function() {

            var noteCollections = new NoteCollection();

            var appView = new AppView();

            App.router = new Router({view: appView, collection: noteCollections});
            Backbone.history.start();
        };

  return {
    initialize: initialize
  };

 });
