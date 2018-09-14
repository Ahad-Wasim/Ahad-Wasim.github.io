const jsonp = (function(){
  const wrapper = {};

  wrapper.send = (src, options) => {

    // the jsonp callback name that is attached on the window object
    const callback_name = options.callbackName || 'callback';
    const on_success = options.onSuccess || function(){};
    const on_timeout = options.onTimeout || function(){};
    const timeout = options.timeout * 1000 || 1000; // one second

    // starts the timer for the onTimeout Callback
    const timeout_trigger = window.setTimeout(() => {
      window[callback_name] = function(){};
      on_timeout();
    }, timeout);
    
    // gets called when the script invokes the callback
    window[callback_name] = function(data){
      // clear the onTimeoutTimer as we have now retrieved data
      window.clearTimeout(timeout_trigger);
      on_success(data);
    }

    // creating the json element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = src;

    // appending the script to the body
    document.body.appendChild(script);
  }

  return wrapper
})();

