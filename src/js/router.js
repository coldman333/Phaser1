
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