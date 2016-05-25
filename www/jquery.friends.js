(function($)
{
  /*
   * don't go back to previous page when search mode is active
   * and the users uses the back button
   */
  var handlePopState = function(page)
  {
    return function()
    {
      window.history.pushState(
      {
        hash: "#page-friends",
        title: "Friends",
        transition: "none",
        pageUrl: "page-friends"
      },
      "Friends",
      "index.html#page-friends");

      $(page).data("jquery.friends.restoreSearch", false);

      methods.toggleSearchMode.apply(page);

      return false;
    }
  }

  var buildFriendListItem = function(profile, user)
  {
    var obj = this;
    var opts = $(this).data("jquery.friends.options");

    // build displayed username:
    var fullname = Tools.buildDisplayUsername(user);

    // build list element:
    var friend = Tools.isFollowing(profile["following"], user["username"]);

    var li = $('<li data-username="' + user["username"].escapeQuotes() + '">' +
               '<div style="float:right;">' +
               '<span style="font-size:smaller;">Follow? </span>' +
               '<select data-mini="true" style="font-size:smaller;">' +
               '<option value="no">No</option>' +
               '<option value="yes">Yes</option>' +
               '</select>' +
               '</div>' +
               '<a href="#">' +
               '<img data-source="' + user["username"].escapeQuotes() + '" src="images/image-loader.gif" alt="">' +
               '<div style="float:left;">' +
               '<h2>' + user["username"] + '</h2>' +
               fullname.escapeHTML() +
               '</div>' +
               '<div style="clear:both;"></div>' +
               '</a></li>');

    li.find("a").on("click", function()
    {
      /* the popstate event handler only handles the back button and so it has to be deactivated
       * before the user profile is opened */
      $(window).unbind("popstate.friends");
      $("body").pagecontainer("change", "#page-foreign-profile?user=" + encodeURIComponent(user["username"]));
    });

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

              if(profile["following"].length == 1)
              {
                $(obj).find('p[data-nofriends="yes"]').show();
              }
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

      $(obj).data("jquery.friends.searchQuery", query);
      $(obj).data("jquery.friends.restoreSearch", true);

      if(query && query.length >= 2 && opts.onGetProfile && opts.onSearch)
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
          .fail(function()
          {
            navigator.notification.alert("Couldn't search user store, please try again.", null, "Request failed", "Ok");
          })
          .always(function()
          {
            $(document).blockUI("hide");
          });
      }

      return this;
    },
    open: function()
    {
      var obj = this;
      var opts = $(this).data("jquery.friends.options");

      if($(obj).data("jquery.friends.restoreSearch"))
      {
        var query = $(obj).data("jquery.friends.searchQuery");

        methods.searchMode.apply(obj, [true]);

        $(this).find("input").val(query);

        methods.search.apply(obj, [query]);

        $(obj).data("jquery.friends.restoreSearch", false);
        $(obj).data("jquery.friends.searchQuery", "");
      }
      else
      {
        methods.searchMode.apply(this, [false]);

        if(opts.onGetProfile && opts.onGetFriends)
        {
          // clear listview:
          var ul = $(this).find("ul");
          var nofriends = $(this).find('p[data-nofriends="yes"]');

          ul.find("li").remove();
          ul.listview();

          nofriends.hide();

          // get friends & insert found profiles:
          $(document).blockUI("show");

          $.when(opts.onGetProfile(), opts.onGetFriends())
            .done(function(profile, friends)
            {
              if(friends.length == 0)
              {
                nofriends.show();
              }
              else
              {
                $(friends).each(function(i, user)
                {
                  ul.append(buildFriendListItem.apply(obj, [profile, user]));
                });

                ul.listview("refresh");
              }
            })
            .fail(function(response)
            {
              navigator.notification.alert("Couldn't load friends, please try again.", null, "Request failed", "Ok");
            })
            .always(function()
            {
              $(document).blockUI("hide");
            });
        }
      }

      return this;
    },
    searchMode: function(active)
    {
      var page = this;
      var ul = $(page).find("ul");

      // remove elements from listview:
      ul.find("li").remove();

      if(active)
      {
        $(page).find('div[data-role="header"] .ui-btn-right').hide();
        $(page).find('p[data-nofriends="yes"]').hide();
        $(window).bind("popstate.friends", handlePopState(page));
      }
      else
      {
        $(page).find('div[data-role="header"] .ui-btn-right').show();
        $(window).unbind("popstate.friends");
      }

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

      // event handler:
      var opts = $(page).data("jquery.friends.options");
      var f = opts.onModeChanged;

      if(f)
      {
        f(active);
      }

      return this;
    },
    toggleSearchMode: function()
    {
      var activate = !$(this).find("form").is(":visible");

      methods.searchMode.apply(this, [activate]);

      if(!activate)
      {
        methods.open.apply(this);
      }

      return this;
    }
  };

  function createFriends(obj, options)
  {
    if(!$(obj).data("jquery.friends"))
    { 
      $(obj).data("jquery.friends", true);
      $(obj).data("jquery.friends.options",
                  $.extend({onGetProfile: null, onGetFriends: null, onSearch: null, onChangeFriendship: null, onGetAvatar: null, onModeChanged: null}, options));
      $(obj).data("jquery.friends.searchQuery", null);
      $(obj).data("jquery.friends.restoreSearch", false);

      // search button:
      var btn = $('<a href="#" data-role="button" data-icon="search" data-theme="b" class="ui-btn-right">Search</a>');

      $(obj).find('div[data-role="header"]').append(btn).toolbar();

      $(btn).on("click", function()
      {
        methods.toggleSearchMode.apply(obj);
      });

      // search form:
      var form = $('<form autocomplete="off">' +
                   '<label style="font-size:large;" for="text-friends-search-query">Search network:</label>' +
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

      // "no friends" info:
      var nofriends = '<p style="font-size:large;" data-nofriends="yes">You don\'t have any friends yet :(</p>';

      $(obj).find('div[data-role="main"]').append(form).append(list).append(nofriends);

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

      return this.each(function()
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
