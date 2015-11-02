'use strict';
define([ 
	"backbone",
	"models/note",
	"localstorage"
	] ,function( Backbone, NoteModel){

		var NotesCollection = Backbone.Collection.extend({
			model: NoteModel,
			localStorage: new Backbone.LocalStorage("NotesList")
		});

		return  NotesCollection;

	});