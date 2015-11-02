
'use strict';
define([ 
	"jquery",
	"underscore",
	"backbone",
	"../collection/notes",
	"views/note"
	] ,function($, _, Backbone, Notes, NoteView ){ 


		var NotesView = Backbone.View.extend({
			template:_.template( $("#noteList").html() ),
			initialize: function () {

				this.listenTo(this.collection, 'remove', this.render);
				this.$el.html(this.template );

				this.noteContainer = this.$('.notesContentList');
				this.emptyNoteContainer = this.$('.emptyContent');

			},		
			render: function () {
				if(this.collection.length) {
					this.collection.each(this.rendetItem, this);

				} else {
					this.emptyNoteContainer.html("<div class='card hoverrable '> Use big +  to add new note </div>")
				}

				return this;
			},

			rendetItem: function(note) {
				var noteView = new NoteView({model:note});
				this.noteContainer.append(noteView.render().$el);
			}


		});

		return  NotesView;
	}); 