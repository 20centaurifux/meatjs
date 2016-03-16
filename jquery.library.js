(function($)
{
  var methods =
  {
    update: function()
    {
      methods.loadPage.apply(this, [0]);
    },
    nextPage: function()
    {
      var page = parseInt($(this).data("options").tail, 10);
      var library = this;

      methods.loadPage.apply(this, [page + 1])
        .done(function(images)
        {
          if(images.length > 0)
          {
            $(library).data("options").tail++;
          }
        });
    },
    loadPage: function(page)
    {
      var f = $(this).data("options").onLoad;

      if(f)
      {
        var library = this;

        return f(page, $(library).data("options").pageSize)
          .done(function(images)
          {
            $(images).each(function()
            {
              methods.touch.apply(library, [this, true]);
            });
          });
      }

      return null;
    },
    touch: function(image, insert)
    {
      // test if image has already been inserted:
      var li = $(this).find('li[data-source="' + image["source"] + '"]').first();

      if(li.get(0))
      {
        // update details of already inserted image:
        $(li).find('p[data-field="comments"]').html('<strong>Comments:</strong> ' + image["comments_n"]);
        $(li).find('p[data-field="score"]').html('<strong>Score:</strong> ' + image["score"]["up"] + ' up, ' + image["score"]["down"] + ' down');
      }
      else
      {
        var compare = $(this).data("options").onCompare;

        // insert new image:
        var html = '<li data-source="' + image["source"] + '" data-timestamp="' + image["created_on"]["$date"] + '">' +
                   '<a href="#"><img data-source="' + image["source"] + '"src="images/image-loader.gif" alt="">' +
                   '<h2>' + image["source"] + '</h2>' +
                   '<p data-field="timestamp"><strong>Created on:</strong> ' + new Date(image["created_on"]["$date"]).toLocaleString() + '</p>' +
                   '<p data-field="comments"><strong>Comments:</strong> ' + image["comments_n"] + '</p>' +
                   '<p data-field="score"><strong>Score:</strong> ' + image["score"]["up"] + ' up, ' + image["score"]["down"] + ' down</p>' +
                   '</a></li>';

        var inserted = false;

        if(compare)
        {
          $(this).find("li").each(function()
          {
            if(compare(image, $(this)))
            {
              $(html).insertBefore(this);
              inserted = true;
            }
          });
        }

        if(!inserted)
        {
          $(this).append(html);
        }
      }

      $(this).listview("refresh");

      // load thumbnail:
      var client = new MeatStore().createClient();

      client.getThumbnail(image["source"])
        .success(function(thumbnail)
        {
          $('img[data-source="' + image["source"] + '"]').attr("src", thumbnail);
        })
        .fail(function(r)
        {
          $('img[data-source="' + image["source"] + '"]').attr("src", "images/image-missing.png");
        });
    }
  };

  function createLibrary(obj, options)
  {
    $(obj).data("options", $.extend({pageSize: 10, tail: 0, onLoad: null, onCompare: null}, options));
    $(obj).data("images", new Array());
  }

  $.fn.library = function(args)
  {
    if(methods[args])
    {
      this.each(function()
      {
        return methods[args].apply(this, Array.prototype.slice.call(arguments, 1));
      });
    }
    else if(typeof args === 'object' || !args)
    {
      return this.each(function()
      {
        createLibrary(this, args);
      });
    }
  }
}(jQuery));
