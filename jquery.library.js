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
      var page = parseInt($(this).data("jquery.library.options").tail, 10);
      var library = this;

      methods.loadPage.apply(this, [page + 1])
        .done(function(images)
        {
          if(images.length > 0)
          {
            $(library).data("jquery.library.options").tail++;
          }
        });
    },
    loadPage: function(page)
    {
      var f = $(this).data("jquery.library.options").onLoad;

      if(f)
      {
        var library = this;

        return f(page, $(this).data("jquery.library.options").pageSize)
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
        $(li).find('span[data-field="comments_n"]').html(image["comments_n"]);
        $(li).find('span[data-field="up"]').html(image["score"]["up"]);
        $(li).find('span[data-field="down"]').html(image["score"]["down"]);
        $(li).find('span[data-field="fav"]').html(image["score"]["fav"]);
      }
      else if(insert)
      {
        var compare = $(this).data("jquery.library.options").onCompare;

        // insert new image:
        var el = $('<li data-source="' + image["source"] + '" data-timestamp="' + image["created_on"]["$date"] + '">' +
                   '<a href="#"><img data-source="' + image["source"] + '"src="images/image-loader.gif" alt="">' +
                   '<h2>' + image["source"] + '</h2>' +
                   '<p><strong>Created on: </strong>' +
                   '<span data-field="date">' + new Date(image["created_on"]["$date"]).toLocaleString() + '</span></p>' +
                   '<p><strong>Comments: </strong>' +
                   '<span data-field="comments_n">' + image["comments_n"] + '</span></p>' +
                   '<p><strong>Score: </strong>' +
                   '<span data-field="up">' + image["score"]["up"] + '</span> up,' +
                   '<span data-field="down">' + image["score"]["down"] + '</span> down, ' +
                   '<span data-field="fav">' + image["score"]["fav"] + '</span> favs</p>' +
                   '</a></li>');

        var inserted = false;

        if(compare)
        {
          $(this).find("li").each(function()
          {
            var obj = {};

            obj["source"] = $(this).data("source");
            obj["created_on"] = {"$data": $(this).data("timestamp")}
            obj["comments_n"] = parseInt($(li).find('span[data-field="comments_n"]').text(), 10);
            obj["score"] = {}
            obj["score"]["up"] = parseInt($(li).find('span[data-field="up"]').text(), 10);
            obj["score"]["down"] = parseInt($(li).find('span[data-field="down"]').text(), 10);
            obj["score"]["fav"] = parseInt($(li).find('span[data-field="fav"]').text(), 10);

            if(compare(image, obj))
            {
              $(html).insertBefore(this);
              inserted = true;
            }
          });
        }

        if(!inserted)
        {
          $(this).append(el);

          var onSelect = $(this).data("jquery.library.options").onSelect;

          if(onSelect)
          {
            el.on("click", function()
            {
              onSelect(($(this).data("source")));
            });
          }
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
    },
    clear: function()
    {
      $(this).find("li").remove();
      $(this).listview("refresh");
    }
  };

  function createLibrary(obj, options)
  {
    $(obj).data("jquery.library", true);
    $(obj).data("jquery.library.options", $.extend({pageSize: 10, tail: 0, onLoad: null, onCompare: null}, options));
  }

  $.fn.library = function(args)
  {
    if(methods[args])
    {
      var parameters = Array.prototype.slice.call(arguments, 1);

      this.each(function()
      {
        if($(this).data("jquery.library"))
        {
          return methods[args].apply(this, parameters);
        }
        else
        {
          return null;
        }
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
