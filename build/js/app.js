
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJhcHAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCc7XG5cbmRlZmluZShbXG4gICAgJ2JhY2tib25lJyxcbiAgICBcInZpZXdzL2FwcFwiLFxuICAgICdyb3V0ZXInLFxuICAgICdjb2xsZWN0aW9uL25vdGVzJ10sXG5cbiAgICBmdW5jdGlvbihCYWNrYm9uZSwgQXBwVmlldywgUm91dGVyLCBOb3RlQ29sbGVjdGlvbil7XG4gICAgICAgICAgIFxuICAgICAgICB2YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgbm90ZUNvbGxlY3Rpb25zID0gbmV3IE5vdGVDb2xsZWN0aW9uKCk7XG5cbiAgICAgICAgICAgIHZhciBhcHBWaWV3ID0gbmV3IEFwcFZpZXcoKTtcblxuICAgICAgICAgICAgQXBwLnJvdXRlciA9IG5ldyBSb3V0ZXIoe3ZpZXc6IGFwcFZpZXcsIGNvbGxlY3Rpb246IG5vdGVDb2xsZWN0aW9uc30pO1xuICAgICAgICAgICAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpO1xuICAgICAgICB9O1xuXG4gIHJldHVybiB7XG4gICAgaW5pdGlhbGl6ZTogaW5pdGlhbGl6ZVxuICB9O1xuXG4gfSk7Il0sImZpbGUiOiJhcHAuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
