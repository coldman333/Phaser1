
define([
 "jquery",
 "backbone",
 "views/note",
 "views/notes",	
 "views/edit-note",
 "views/note-details",
 "models/note",
 ] ,function($, Backbone, NoteView, NotesView, EditNoteView, NotesDetailsView, NoteModel){
 

 var Router = Backbone.Router.extend({
     routes: {
        "": "home", 
        "!/": "home", 
        "add": "add", 
        "note/:number": "note", 
        "note/:number/edit": "noteEdit" 
     } ,

     initialize: function(options) {
     	console.log("router init");
     	console.log(this);
        this.appView = options.view;
        this.collection = options.collection;
        this.collection.fetch();
    },
    home: function () {
     
    	var notesView = new NotesView({
    	 	collection: this.collection
    	 });
    	 this.appView.setViews(notesView);

    },
    add: function (cid) {

     var addNoteView = new EditNoteView({
        model: new NoteModel()
      });
      this.appView.setViews(addNoteView);


       addNoteView.on('form:submitted', function(formObj) {

       	if( this.collection.isEmpty() ){
             formObj.id = 1;
       		} else {
             formObj.id = _.max(this.collection.pluck('id')) + 1

       	}
     
        var newNote = new NoteModel(formObj);
          this.collection.add(newNote);
          newNote.save();
          App.router.navigate('#', {trigger: true});

        }, this);

   
    },
    note: function (note_id) {

      var note = this.collection.get(note_id);
      var notesDetailsView = new NotesDetailsView({
        model: note
      });
      this.appView.setViews(notesDetailsView);
     
    },
    noteEdit: function (note_id) {
      var note = this.collection.get(note_id);
      var editNoteView = new EditNoteView({
        model: note
      });
      this.appView.setViews(editNoteView);
       editNoteView.on('form:submitted', function(formObj) {
       
          note.save(formObj);
           App.router.navigate('#', {trigger: true});

       });
    }	
 });

return Router;
 //Backbone.history.start();     

});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJyb3V0ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5kZWZpbmUoW1xuIFwianF1ZXJ5XCIsXG4gXCJiYWNrYm9uZVwiLFxuIFwidmlld3Mvbm90ZVwiLFxuIFwidmlld3Mvbm90ZXNcIixcdFxuIFwidmlld3MvZWRpdC1ub3RlXCIsXG4gXCJ2aWV3cy9ub3RlLWRldGFpbHNcIixcbiBcIm1vZGVscy9ub3RlXCIsXG4gXSAsZnVuY3Rpb24oJCwgQmFja2JvbmUsIE5vdGVWaWV3LCBOb3Rlc1ZpZXcsIEVkaXROb3RlVmlldywgTm90ZXNEZXRhaWxzVmlldywgTm90ZU1vZGVsKXtcbiBcblxuIHZhciBSb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIuZXh0ZW5kKHtcbiAgICAgcm91dGVzOiB7XG4gICAgICAgIFwiXCI6IFwiaG9tZVwiLCBcbiAgICAgICAgXCIhL1wiOiBcImhvbWVcIiwgXG4gICAgICAgIFwiYWRkXCI6IFwiYWRkXCIsIFxuICAgICAgICBcIm5vdGUvOm51bWJlclwiOiBcIm5vdGVcIiwgXG4gICAgICAgIFwibm90ZS86bnVtYmVyL2VkaXRcIjogXCJub3RlRWRpdFwiIFxuICAgICB9ICxcblxuICAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgIFx0Y29uc29sZS5sb2coXCJyb3V0ZXIgaW5pdFwiKTtcbiAgICAgXHRjb25zb2xlLmxvZyh0aGlzKTtcbiAgICAgICAgdGhpcy5hcHBWaWV3ID0gb3B0aW9ucy52aWV3O1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24gPSBvcHRpb25zLmNvbGxlY3Rpb247XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbi5mZXRjaCgpO1xuICAgIH0sXG4gICAgaG9tZTogZnVuY3Rpb24gKCkge1xuICAgICBcbiAgICBcdHZhciBub3Rlc1ZpZXcgPSBuZXcgTm90ZXNWaWV3KHtcbiAgICBcdCBcdGNvbGxlY3Rpb246IHRoaXMuY29sbGVjdGlvblxuICAgIFx0IH0pO1xuICAgIFx0IHRoaXMuYXBwVmlldy5zZXRWaWV3cyhub3Rlc1ZpZXcpO1xuXG4gICAgfSxcbiAgICBhZGQ6IGZ1bmN0aW9uIChjaWQpIHtcblxuICAgICB2YXIgYWRkTm90ZVZpZXcgPSBuZXcgRWRpdE5vdGVWaWV3KHtcbiAgICAgICAgbW9kZWw6IG5ldyBOb3RlTW9kZWwoKVxuICAgICAgfSk7XG4gICAgICB0aGlzLmFwcFZpZXcuc2V0Vmlld3MoYWRkTm90ZVZpZXcpO1xuXG5cbiAgICAgICBhZGROb3RlVmlldy5vbignZm9ybTpzdWJtaXR0ZWQnLCBmdW5jdGlvbihmb3JtT2JqKSB7XG5cbiAgICAgICBcdGlmKCB0aGlzLmNvbGxlY3Rpb24uaXNFbXB0eSgpICl7XG4gICAgICAgICAgICAgZm9ybU9iai5pZCA9IDE7XG4gICAgICAgXHRcdH0gZWxzZSB7XG4gICAgICAgICAgICAgZm9ybU9iai5pZCA9IF8ubWF4KHRoaXMuY29sbGVjdGlvbi5wbHVjaygnaWQnKSkgKyAxXG5cbiAgICAgICBcdH1cbiAgICAgXG4gICAgICAgIHZhciBuZXdOb3RlID0gbmV3IE5vdGVNb2RlbChmb3JtT2JqKTtcbiAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24uYWRkKG5ld05vdGUpO1xuICAgICAgICAgIG5ld05vdGUuc2F2ZSgpO1xuICAgICAgICAgIEFwcC5yb3V0ZXIubmF2aWdhdGUoJyMnLCB7dHJpZ2dlcjogdHJ1ZX0pO1xuXG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICBcbiAgICB9LFxuICAgIG5vdGU6IGZ1bmN0aW9uIChub3RlX2lkKSB7XG5cbiAgICAgIHZhciBub3RlID0gdGhpcy5jb2xsZWN0aW9uLmdldChub3RlX2lkKTtcbiAgICAgIHZhciBub3Rlc0RldGFpbHNWaWV3ID0gbmV3IE5vdGVzRGV0YWlsc1ZpZXcoe1xuICAgICAgICBtb2RlbDogbm90ZVxuICAgICAgfSk7XG4gICAgICB0aGlzLmFwcFZpZXcuc2V0Vmlld3Mobm90ZXNEZXRhaWxzVmlldyk7XG4gICAgIFxuICAgIH0sXG4gICAgbm90ZUVkaXQ6IGZ1bmN0aW9uIChub3RlX2lkKSB7XG4gICAgICB2YXIgbm90ZSA9IHRoaXMuY29sbGVjdGlvbi5nZXQobm90ZV9pZCk7XG4gICAgICB2YXIgZWRpdE5vdGVWaWV3ID0gbmV3IEVkaXROb3RlVmlldyh7XG4gICAgICAgIG1vZGVsOiBub3RlXG4gICAgICB9KTtcbiAgICAgIHRoaXMuYXBwVmlldy5zZXRWaWV3cyhlZGl0Tm90ZVZpZXcpO1xuICAgICAgIGVkaXROb3RlVmlldy5vbignZm9ybTpzdWJtaXR0ZWQnLCBmdW5jdGlvbihmb3JtT2JqKSB7XG4gICAgICAgXG4gICAgICAgICAgbm90ZS5zYXZlKGZvcm1PYmopO1xuICAgICAgICAgICBBcHAucm91dGVyLm5hdmlnYXRlKCcjJywge3RyaWdnZXI6IHRydWV9KTtcblxuICAgICAgIH0pO1xuICAgIH1cdFxuIH0pO1xuXG5yZXR1cm4gUm91dGVyO1xuIC8vQmFja2JvbmUuaGlzdG9yeS5zdGFydCgpOyAgICAgXG5cbn0pOyJdLCJmaWxlIjoicm91dGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
