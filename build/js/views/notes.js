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
                    
                     console.log("NOT EMPTY CONTROLER");
			         this.collection.each(this.rendetItem, this);

			      } else {
			      	  console.log("EMPTY CONTROLER")
                      this.emptyNoteContainer.html("<div class='card hoverrable '> Use big +  to add new note </div>")
			      }


				//	this.$el.html(this.template );

			      return this;
        		},

        		rendetItem: function(note) {
     				 var noteView = new NoteView({model:note});
      				 this.noteContainer.append(noteView.render().$el);
   				 }


		});

		return  NotesView;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aWV3cy9ub3Rlcy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJkZWZpbmUoWyBcblx0XCJqcXVlcnlcIixcblx0XCJ1bmRlcnNjb3JlXCIsXG5cdFwiYmFja2JvbmVcIixcblx0XCIuLi9jb2xsZWN0aW9uL25vdGVzXCIsXG5cdFwidmlld3Mvbm90ZVwiXG5cdF0gLGZ1bmN0aW9uKCQsIF8sIEJhY2tib25lLCBOb3RlcywgTm90ZVZpZXcgKXsgXG5cblxuXHRcdHZhciBOb3Rlc1ZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cdFx0XHQgICB0ZW1wbGF0ZTpfLnRlbXBsYXRlKCAkKFwiI25vdGVMaXN0XCIpLmh0bWwoKSApLFxuXHRcdFx0ICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuVG8odGhpcy5jb2xsZWN0aW9uLCAncmVtb3ZlJywgdGhpcy5yZW5kZXIpO1xuICAgICAgICAgICAgICAgICB0aGlzLiRlbC5odG1sKHRoaXMudGVtcGxhdGUgKTtcblx0ICAgICBcbiAgICAgICAgICAgICAgICAgdGhpcy5ub3RlQ29udGFpbmVyID0gdGhpcy4kKCcubm90ZXNDb250ZW50TGlzdCcpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5lbXB0eU5vdGVDb250YWluZXIgPSB0aGlzLiQoJy5lbXB0eUNvbnRlbnQnKTtcbiBcblx0XHRcdCAgIH0sXG5cdFx0XHQgIFxuXHRcdFx0ICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cblxuXHRcdFx0ICAgICAgaWYodGhpcy5jb2xsZWN0aW9uLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTk9UIEVNUFRZIENPTlRST0xFUlwiKTtcblx0XHRcdCAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5lYWNoKHRoaXMucmVuZGV0SXRlbSwgdGhpcyk7XG5cblx0XHRcdCAgICAgIH0gZWxzZSB7XG5cdFx0XHQgICAgICBcdCAgY29uc29sZS5sb2coXCJFTVBUWSBDT05UUk9MRVJcIilcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtcHR5Tm90ZUNvbnRhaW5lci5odG1sKFwiPGRpdiBjbGFzcz0nY2FyZCBob3ZlcnJhYmxlICc+IFVzZSBiaWcgKyAgdG8gYWRkIG5ldyBub3RlIDwvZGl2PlwiKVxuXHRcdFx0ICAgICAgfVxuXG5cblx0XHRcdFx0Ly9cdHRoaXMuJGVsLmh0bWwodGhpcy50ZW1wbGF0ZSApO1xuXG5cdFx0XHQgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgXHRcdH0sXG5cbiAgICAgICAgXHRcdHJlbmRldEl0ZW06IGZ1bmN0aW9uKG5vdGUpIHtcbiAgICAgXHRcdFx0XHQgdmFyIG5vdGVWaWV3ID0gbmV3IE5vdGVWaWV3KHttb2RlbDpub3RlfSk7XG4gICAgICBcdFx0XHRcdCB0aGlzLm5vdGVDb250YWluZXIuYXBwZW5kKG5vdGVWaWV3LnJlbmRlcigpLiRlbCk7XG4gICBcdFx0XHRcdCB9XG5cblxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuICBOb3Rlc1ZpZXc7XG59KTsiXSwiZmlsZSI6InZpZXdzL25vdGVzLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
