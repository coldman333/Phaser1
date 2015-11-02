define([ 
	"jquery",
	"underscore",
	"backbone",
	"../collection/notes",
	"views/note"
	], function($, _, Backbone, Notes, NoteView ){ 

		var NotesDetailsView = Backbone.View.extend({

			   template: _.template($("#noteDetailsItem").html()),
		       initialize: function(){},
		       render: function(){
		         var html = this.template(this.model.toJSON());
                 this.$el.append(html);
		         return this;
		       }



        });

        return NotesDetailsView ;
  

});

