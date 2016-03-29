(function($)
{
  var buildFriendListItem = function(profile, user)
  {
    var obj = this;
    var opts = $(this).data("jquery.friends.options");

    // build displayed username:
    var fullname = user["firstname"];

    if(user["firstname"] && user["lastname"])
    {
      fullname += " " + user["lastname"]
    }
    else if(!fullname)
    {
      fullname = user["lastname"];
    }

    if(!fullname)
    {
      fullname = "";
    }

    // build list element:
    var friend = $.inArray(user["username"], profile["following"]) > -1;

    var li = $('<li data-username="' + user["username"] + '">' +
               '<img data-source="' + user["username"] + '" src="images/image-loader.gif" alt="">' +
               '<div style="float:right;"><span style="font-size:smaller; font-weight:bold;">Follow</span> <select data-mini="true">' +
               '<option value="no">No</option>' +
               '<option value="yes">Yes</option>' +
               '</select></div>' +
               '<div style="float:left;"><h2>' + user["username"] + '</h2></div>' +
               '<div style="clear:both;"></div>' +
               fullname +
               '</li>');

    var sel = li.find("select");

    sel.data("locked", false);
    sel.val(friend ? "yes" : "no");
    sel.flipswitch();

    sel.on("change", function()
    {
      var friend = $(sel).val() == "yes";

      if(opts.onChangeFriendship && !$(sel).data("locked"))
      {
        $(document).blockUI("show");

        opts.onChangeFriendship(li.data("username"), friend)
          .done(function()
          {
            var form = $(obj).find("form");

            if(!friend && !form.is(":visible"))
            {
              li.remove();
            }
          })
          .fail(function()
          {
            $(sel).data("locked", true);
            $(sel).val(friend ? "no": "yes").flipswitch("refresh");
            $(sel).data("locked", false);
          })
          .always(function()
          {
            $(document).blockUI("hide");
          });
      }
    });

    // load avatar:
    if(opts.onGetAvatar)
    {
      opts.onGetAvatar(user["username"])
        .done(function(image)
        {
          $(li).find("img").attr("src", image);
        })
        .fail(function()
        {
          $(li).find("img").attr("src", "images/image-missing.png");
        });
    }

    return li;
  }

  var methods =
  {
    search: function(query)
    {
      var obj = this;
      var opts = $(this).data("jquery.friends.options");

      if(query && query.length > 2 && opts.onGetProfile && opts.onSearch)
      {
        $(document).blockUI("show");

        // clear listview:
        var ul = $(this).find("ul");

        ul.find("li").remove();
        ul.listview();

        // search users & insert found profiles:
        $.when(opts.onGetProfile(), opts.onSearch(query))
          .done(function(profile, result)
          {
            $(result[0]).each(function(i, user)
            {
              ul.append(buildFriendListItem.apply(obj, [profile, user]));
            });

            ul.listview("refresh");
          })
          .always(function()
          {
            $(document).blockUI("hide");
          });
      }
    },
    open: function()
    {
      var obj = this;
      var opts = $(this).data("jquery.friends.options");

      if($(this).find("form").is(":visible"))
      {
        methods.searchMode.apply(this, [false]);
      }

      if(opts.onGetProfile && opts.onGetFriends)
      {
        // clear listview:
        var ul = $(this).find("ul");

        ul.find("li").remove();
        ul.listview();

        // get friends & insert found profiles:
        $(document).blockUI("show");

        $.when(opts.onGetProfile(), opts.onGetFriends())
          .done(function(profile, friends)
          {
            $(friends).each(function(i, user)
            {
              ul.append(buildFriendListItem.apply(obj, [profile, user]));
            });

            ul.listview("refresh");
          })
          .always(function()
          {
            $(document).blockUI("hide");
          });
      }
    },
    searchMode: function(active)
    {
      var removeId = "back";
      var addId = "search";
      var text = "Search";
      var ul = $(this).find("ul");

      // remove elements from listview:
      ul.find("li").remove();

      if(active)
      {
        removeId = addId;
        addId = "back";
        text = "Close";
      }

      // update search button:
      $(this).find('div[data-role="header"] .ui-btn-right')
        .removeClass("ui-icon-" + removeId)
        .attr("data-icon", addId)
        .addClass("ui-icon-" + addId)
        .text(text)
        .trigger("refresh");

      // update form visibility:
      var form = $(this).find("form");

      if(active)
      {
        var input = $(this).find("input");

        form.show();
        input.val("");
        input.focus();
      }
      else
      {
        form.hide();
      }
    },
    toggleSearchMode: function()
    {
      var activate = !$(this).find("form").is(":visible");

      methods.searchMode.apply(this, [activate]);

      if(!activate)
      {
        methods.open.apply(this);
      }
    }
  };

  function createFriends(obj, options)
  {
    if(!$(obj).data("jquery.friends"))
    { 
      $(obj).data("jquery.friends", true);
      $(obj).data("jquery.friends.options",
                  $.extend({onGetProfile: null, onGetFriends: null, onSearch: null, onChangeFriendship: null, onGetAvatar: null}, options));

      // search button:
      var btn = $('<a href="#" data-role="button" data-icon="search" data-theme="b" class="ui-btn-right">Search</a>');

      $(obj).find('div[data-role="header"]').append(btn).toolbar();

      $(btn).on("click", function()
      {
        methods.toggleSearchMode.apply(obj);
      });

      // search form:
      var form = $('<form autocomplete="off">' +
                   '<label for="text-friends-search-query">Search network:</label>' +
                   '<input type="text" data-type="search" name="text-friends-search-query">' +
                   '</form>')

      var input = form.find("input");

      input.uniqueId().textinput();
      form.find("label").attr("for", input.attr("id"));

      form.submit(function()
      {
        methods.search.apply(obj, [form.find("input").val()]);

        return false;
      });

      form.hide();

      $(obj).trigger("create");

      // create & insert listview:
      var list = $('<ul data-role="listview" data-inset="true"></ul>');

      list.listview();

      $(obj).find('div[data-role="main"]').append(form).append(list);

      // handle search query clear button:
      $(form).on("click", '.ui-input-clear', function()
      {
        $(list).find("li").remove();
        $(list).listview("refresh");
      });
    }
  }

  $.fn.friends = function(args)
  {
    if(methods[args])
    {
      var parameters = Array.prototype.slice.call(arguments, 1);

      this.each(function()
      {
        if($(this).data("jquery.friends"))
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
        createFriends(this, args);
      });
    }
  }
}(jQuery));
