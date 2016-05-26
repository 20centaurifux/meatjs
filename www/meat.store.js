  var MeatStore = function(options)
  {
    var cache = $(options).prop('Cache') || new MeatCache();
    var storage = $(options).prop('Storage') || LocalMeatStorage;
    var avatarTimestamp = new Date().getTime();
    var store = this;

    this.createClient = function()
    {
      var client = new MeatREST();

      client.setAuthData(storage.load("user.Username"), storage.load("user.Password"));

      return client;
    }

    this.getCredentials = function()
    {
      return {Username: storage.load("user.Username"), Password: storage.load("user.Password")};
    }

    this.configured = function()
    {
      return storage.loadBool("app.Configured");
    }

    this.setConfigured = function()
    {
      storage.storeBool("app.Configured", true);
    }

    this.changeCredentials = function(username, password)
    {
      storage.store("user.Username", username);
      storage.store("user.Password", password);

      cache.remove("user.Profile");

      return store.getOwnProfile();
    }

    this.getOwnProfile = function()
    {
      var d = $.Deferred();

      setTimeout(function()
      {
        var profile = cache.getJSON("user.Profile");

        if(profile == null)
        {
          var client = store.createClient();

          client.getOwnProfile()
            .success(function(profile)
            {
              Tools.sortICase(profile["following"]);

              cache.setJSON("user.Profile", profile, 300);
              d.resolve(profile);
            })
            .fail(d.reject);
        }
        else
        {
          d.resolve(profile);
        }
      }, 1);

      return d.promise();
    }

    this.getProfile = function(username)
    {
      var d = $.Deferred();

      setTimeout(function()
      {
        var key = "user.Other." + username.toLowerCase();
        var profile = cache.getJSON(key);

        if(profile == null)
        {
          var client = store.createClient();

          client.getProfile(username)
            .success(function(profile)
            {
              if(profile["following"])
              {
                Tools.sortICase(profile["following"]);
              }

              cache.setJSON(key, profile, 300);
              d.resolve(profile);
            })
            .fail(d.reject);
        }
        else
        {
          d.resolve(profile);
        }
      }, 1);

      return d.promise();
    }

    this.updateProfile = function(email, firstname, lastname, language, sex, protected)
    {
      var p = store.createClient().updateProfile(email, firstname, lastname, sex, language, protected);

      p.done(function(profile)
      {
        Tools.ICase(profile["following"]);
        cache.setJSON("user.Profile", profile, 300);
      });

      return p;
    }

    this.updatePassword = function(new_password1, new_password2)
    {
      var d = $.Deferred();

      store.createClient().updatePassword(storage.load("user.Password"), new_password1, new_password2)
        .success(function(response)
        {
          storage.store("user.Password", new_password1);

          d.resolve(response);
        })
        .fail(d.reject);

      return d.promise();
    }

    this.requestAccount = function(username, email)
    {
      var d = $.Deferred();

      store.createClient().requestAccount(username, email)
        .success(function(response)
        {
          storage.storeInt("app.LastAccountRequest", new Date().getTime());
          d.resolve(response);
        })
        .fail(d.reject);

      return d.promise();
    }

    this.lastAccountRequestTimeoutExpired = function(seconds)
    {
      return isExpired("app.LastAccountRequest", seconds);
    }

    this.requestPassword = function(username, email)
    {
      var d = $.Deferred();

      store.createClient().requestPassword(username, email)
        .success(function(response)
        {
          storage.storeInt("app.LastPasswordReset", new Date().getTime());
          d.resolve(response);
        })
        .fail(d.reject);

      return d.promise();
    }

    this.lastPasswordResetTimeoutExpired = function(seconds)
    {
      return isExpired("app.LastPasswordReset", seconds);
    }

    var isExpired = function(key, seconds)
    {
      var timestamp = storage.loadInt(key);
      var expired = true;

      if(!isNaN(timestamp))
      {
        var diff = (new Date().getTime() - timestamp) / 1000;

        expired = diff > seconds;
      }

      return expired;
    }

    this.getObjects = function(page, pageSize)
    {
      return store.createClient().getObjects(page, pageSize).promise();
    }

    this.getRandom = function(pageSize)
    {
      return store.createClient().getRandomObjects(pageSize).promise();
    }

    this.getPopular = function(page, pageSize)
    {
      return store.createClient().getPopularObjects(page, pageSize).promise();
    }

    this.getObject = function(guid)
    {
      return store.createClient().getObject(guid).promise();
    }

    this.getFavorites = function(fromCache)
    {
      var d = $.Deferred();

      setTimeout(function()
      {
        var favorites = null;
        
        if(fromCache)
        {
          favorites = cache.getJSON("user.Favorites");
        }

        if(favorites == null)
        {
          var client = store.createClient();

          client.getFavorites()
            .success(function(favorites)
            {
              cache.setJSON("user.Favorites", favorites, 900, MeatCache.FLAGS_REFRESH_ON_READ);
              d.resolve(favorites);
            })
            .fail(d.reject);
        }
        else
        {
          d.resolve(favorites);
        }
      }, 1);

      return d.promise();
    }

    this.favor = function(guid, favor)
    {
      var client = store.createClient();

      return client.favor(guid, favor).then(function(favorites)
      {
        cache.setJSON("user.Favorites", favorites, 900, MeatCache.FLAGS_REFRESH_ON_READ);

        return client.getObject(guid);
      });
    }

    this.getVote = function(guid)
    {
      var d = $.Deferred();

      setTimeout(function()
      {
        var vote = cache.getJSON("user.Vote." + guid);

        if(vote == null)
        {
          var client = store.createClient();

          store.createClient().getVote(guid)
            .success(function(vote)
            {
              cache.setJSON("user.Vote." + guid, vote, 900, MeatCache.FLAGS_REFRESH_ON_READ);
              d.resolve(vote);
            })
            .fail(d.reject);
        }
        else
        {
          d.resolve(vote);
        }
      }, 1);

      return d.promise();
    }

    this.like = function(guid, like)
    {
      var client = store.createClient();

      cache.remove("user.Vote." + guid);

      return client.vote(guid, like).then(function() { return client.getObject(guid); });
    }

    this.getImage = function(source)
    {
      return store.createClient().getImage(source).promise();
    }

    this.searchUsers = function(query)
    {
      return store.createClient().searchUsers(query).promise();
    }

    this.follow = function(username, follow)
    {
      var client = store.createClient();

      return client.follow(username, follow).then(function()
      {
        cache.remove("user.Profile");
        cache.remove("user.Other." + username.toLowerCase());

        return store.getOwnProfile();
      });
    }

    this.getAvatar = function(username)
    {
      if(username.toLowerCase() == storage.load("user.Username").toLowerCase())
      {
        return store.getOwnAvatar();
      }

      return store.createClient().getAvatar(username).promise();
    }

    this.getOwnAvatar = function()
    {
      return store.createClient().getOwnAvatar(avatarTimestamp).promise();
    }

    this.uploadAvatar = function(file)
    {
        return store.createClient().uploadAvatar(file).promise()
          .done(function()
          {
            avatarTimestamp = new Date().getTime();
          });
    }

    this.getComments = function(guid, page, pageSize)
    {
      return store.createClient().getComments(guid, page, pageSize);
    }

    this.addComment = function(guid, text)
    {
      var client = store.createClient();

      return client.addComment(guid, text).then(function() { return client.getObject(guid); });
    }

    this.getMessages = function(pageSize, after)
    {
      return store.createClient().getMessages(pageSize, after);
    }
}
