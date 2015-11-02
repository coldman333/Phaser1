
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aWV3cy9lZGl0LW5vdGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5kZWZpbmUoW1xuIFwianF1ZXJ5XCIsXG4gJ3VuZGVyc2NvcmUnLFxuIFwiYmFja2JvbmVcIixcbiBdLCBmdW5jdGlvbigkLCBfLCBCYWNrYm9uZSApIHtcblxuXG4gIHZhciBFZGl0Tm90ZVZpZXcgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG4gICAgICAgdGVtcGxhdGU6IF8udGVtcGxhdGUoJChcIiNlZGl0Tm90ZUl0ZW1cIikuaHRtbCgpKSxcbiAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpe1xuXG4gICAgICAgICAgLy8gdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlICk7XG4gICAgICAgfSxcbiAgICAgICBldmVudHM6e1xuICAgICAgIFx0XHQgICdzdWJtaXQgLnN1Ym1pdEZvcm0nOiAnb25Gb3JtU3VibWl0JyAsXG4gICAgICAgXHRcdCAgJ2NsaWNrIC5idG4tc3VibWl0JzogJ29uRm9ybVN1Ym1pdCcgXG4gICAgICAgfSxcbiAgICAgICByZW5kZXI6IGZ1bmN0aW9uKCl7XG5cblx0XHQgIGlmKHRoaXMubW9kZWwuaXNOZXcoKSl7XG5cdFx0ICBcdCAgICAgdGhpcy4kZWwuaHRtbCh0aGlzLnRlbXBsYXRlKHsgdGl0bGU6XCJcIixkZXNjcmlwdGlvbjpcIlwifSApKTtcblx0XHQgIFx0fSBlbHNle1xuICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICB0aGlzLiRlbC5hcHBlbmQodGhpcy50ZW1wbGF0ZSh0aGlzLm1vZGVsLnRvSlNPTigpKSk7XG5cblx0XHQgIFx0fVxuICAgICAgICAgIFxuICAgICAgICAgXG4gICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICB9LFxuICAgICAgIG9uRm9ybVN1Ym1pdDpmdW5jdGlvbihlKXtcbiAgIFxuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHR2YXIgZm9ybU9iaiA9IHtcbiAgICAgICAgICAgICAgICAgdGl0bGU6IHRoaXMuJChcIi5mb3JtVGl0bGVcIikudmFsKCksXG4gICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAgdGhpcy4kKFwiLmZvcm1EZXNjcmlwdGlvblwiKS52YWwoKVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnRyaWdnZXIoJ2Zvcm06c3VibWl0dGVkJywgZm9ybU9iaik7XG5cbiAgICAgICB9XG5cblxuICB9KTtcblxuICByZXR1cm4gRWRpdE5vdGVWaWV3O1xufSk7Il0sImZpbGUiOiJ2aWV3cy9lZGl0LW5vdGUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
