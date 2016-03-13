var LocalMeatStorage =
{
  store: function(key, value)
  {
    localStorage.setItem(key, value);
  },
  storeJSON: function(key, json)
  {
    this.store(key, JSON.stringify(json));
  },
  storeInt: function(key, n)
  {
    this.store(key, n);
  },
  storeBool: function(key, v)
  {
    this.store(key, v ? "true" : "false");
  },
  load: function(key)
  {
    return localStorage.getItem(key);
  },
  loadJSON: function(key)
  {
    return eval("(" + this.load(key) + ")");
  },
  loadInt: function(key)
  {
    return parseInt(this.load(key), 10);
  },
  loadBool: function(key)
  {
    return this.load(key) == "true";
  },
  remove: function(key)
  {
    localStorage.removeItem(key);
  },
  each: function(f)
  {
    $.each(localStorage, f);
  }
};
