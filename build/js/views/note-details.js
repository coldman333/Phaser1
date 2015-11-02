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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aWV3cy9ub3RlLWRldGFpbHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVmaW5lKFsgXG5cdFwianF1ZXJ5XCIsXG5cdFwidW5kZXJzY29yZVwiLFxuXHRcImJhY2tib25lXCIsXG5cdFwiLi4vY29sbGVjdGlvbi9ub3Rlc1wiLFxuXHRcInZpZXdzL25vdGVcIlxuXHRdLCBmdW5jdGlvbigkLCBfLCBCYWNrYm9uZSwgTm90ZXMsIE5vdGVWaWV3ICl7IFxuXG5cdFx0dmFyIE5vdGVzRGV0YWlsc1ZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cblx0XHRcdCAgIHRlbXBsYXRlOiBfLnRlbXBsYXRlKCQoXCIjbm90ZURldGFpbHNJdGVtXCIpLmh0bWwoKSksXG5cdFx0ICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCl7fSxcblx0XHQgICAgICAgcmVuZGVyOiBmdW5jdGlvbigpe1xuXHRcdCAgICAgICAgIHZhciBodG1sID0gdGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKTtcbiAgICAgICAgICAgICAgICAgdGhpcy4kZWwuYXBwZW5kKGh0bWwpO1xuXHRcdCAgICAgICAgIHJldHVybiB0aGlzO1xuXHRcdCAgICAgICB9XG5cblxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBOb3Rlc0RldGFpbHNWaWV3IDtcbiAgXG5cbn0pOyJdLCJmaWxlIjoidmlld3Mvbm90ZS1kZXRhaWxzLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
