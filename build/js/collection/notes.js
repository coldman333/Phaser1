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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJjb2xsZWN0aW9uL25vdGVzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImRlZmluZShbIFxuXHRcImJhY2tib25lXCIsXG5cdFwibW9kZWxzL25vdGVcIixcblx0XCJsb2NhbHN0b3JhZ2VcIlxuXHRdICxmdW5jdGlvbiggQmFja2JvbmUsIE5vdGVNb2RlbCl7XG5cblx0dmFyIE5vdGVzQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgICAgICAgICBtb2RlbDogTm90ZU1vZGVsLFxuICAgICAgICAgIGxvY2FsU3RvcmFnZTogbmV3IEJhY2tib25lLkxvY2FsU3RvcmFnZShcIk5vdGVzTGlzdFwiKVxuICAgICB9KTtcblxuXHRyZXR1cm4gIE5vdGVzQ29sbGVjdGlvbjtcblxufSk7Il0sImZpbGUiOiJjb2xsZWN0aW9uL25vdGVzLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
