
define([
 "jquery",
 'underscore',
 "backbone",
 ], function($, _, Backbone ) {


  var EditNoteView = Backbone.View.extend({
       template: _.template($("#editNoteItem").html()),
       initialize: function(){

          // this.$el.html(this.template );
       },
       events:{
       		  'submit .submitForm': 'onFormSubmit' ,
       		  'click .btn-submit': 'onFormSubmit' 
       },
       render: function(){

		  if(this.model.isNew()){
		  	     this.$el.html(this.template({ title:"",description:""} ));
		  	} else{
             
                 this.$el.append(this.template(this.model.toJSON()));

		  	}
          
         
         return this;
       },
       onFormSubmit:function(e){
   
			e.preventDefault();

			var formObj = {
                 title: this.$(".formTitle").val(),
                 description:  this.$(".formDescription").val()
			}

			this.trigger('form:submitted', formObj);

       }


  });

  return EditNoteView;
});