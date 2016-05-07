String.prototype.escapeHTML = function()
{
  var m = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': '&quot;', "'": '&#39;', "/": '&#x2F;'};

  return String(this).replace(/[&<>"'\/]/g, function(s)
  {
    return m[s];
  });
}

String.prototype.escapeQuotes = function()
{
  var m = {"\"": "\\\"", "'": "\\'"};

  return String(this.replace("\\", "\\\\")).replace(/["']/g, function(s)
  {
    return m[s];
  });
}
