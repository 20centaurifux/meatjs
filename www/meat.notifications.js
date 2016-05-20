var MeatNotification = function(options)
{
  var storage = $(options).prop('Storage') || LocalMeatStorage;
  var onNotify = $(options).prop('onNotify');
  var notified = {};
  var notified_timestamp = {};

  this.enable = function(id)
  {
    storage.storeInt("notification." + id + ".enabled", 1);
  }

  this.disable = function(id)
  {
    storage.storeInt("notification." + id + ".enabled", 0);
  }

  this.enabled = function(id)
  {
    return storage.loadInt("notification." + id + ".enabled") == 1;
  }

  this.feed = function(id, timestamp)
  {
    if(storage.loadInt("notification." + id + ".enabled") == 1)
    {
      var mostRecent = storage.loadInt("notification." + id + ".timestamp");

      if((mostRecent == null || isNaN(mostRecent) || timestamp > mostRecent) && onNotify)
      {
        if(!notified[id])
        {
          onNotify(id, timestamp);
        }

        notified[id] = true;

        if(!notified_timestamp[id] || notified_timestamp[id] < timestamp)
        {
          notified_timestamp[id] = timestamp;
        }
      }
    }
  }

  this.markReceived = function(id)
  {
    if(notified[id])
    {
      storage.storeInt("notification." + id + ".timestamp", notified_timestamp[id]);
      notified[id] = false;
    }
  }

  this.lastNotified = function(id)
  {
    var lastNotified = storage.loadInt("notification." + id + ".timestamp");

    if(lastNotified == null || isNaN(lastNotified))
    {
      return null;
    }

    return new Date(lastNotified);
  }
};
