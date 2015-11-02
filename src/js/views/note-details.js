'use strict';
define([ 
	"jquery",
	"underscore",
	"backbone",
	"../collection/notes",
	"views/note"
	], function($, _, Backbone, Notes, NoteView ){ 

		var NotesDetailsView = Backbone.View.extend({

			template: _.template($("#noteDetailsItem").html()),

			events:{
				'click .btn-delete': 'onDelete'
			},
			initialize: function(){},
			render: function(){
				var html = this.template(this.model.toJSON());
				this.$el.append(html);
				return this;
			},
			onDelete: function(e){
				e.preventDefault();
				
				debugger;

				var confirmation = window.confirm('Do you want to delete the note "' + this.model.get("title") +'" ?');
				if(confirmation ){
					this.model.destroy();	
					this.$el.html('<div class="alert"> Delete succesful</div>');
					setTimeout(function(){ 
						App.router.navigate('#', {trigger: true});
					},1000)
				}

			}

		});
		return NotesDetailsView ;

});

