class TwitchAPI {
  constructor() {
    const CLIENT_ID = "8zorl9qa9ljkfz9j3mz4wbs1vvnrox";
    this.API_URL = "https://api.twitch.tv/kraken/search/streams";
    this.getClientId = () => {
      return CLIENT_ID;
    };
  }

  searchStream(query, limit, offset) {
    
    const callbackName = "retrieveStreamResults";

    const params = `?query=${query}&client_id=${this.getClientId()}&limit=${limit}&offset=${offset}&callback=${callbackName}`;
    const URL = this.API_URL + params;

    return new Promise((resolve, reject) => {

      jsonp.send(URL, {
        callbackName,
        // access callbackName and invoke the onSuccess function
        onSuccess: function(json){ 
            resolve(json);
        },
        onTimeout: function(){
            reject('timeout!');
        },
        timeout: 5
      })
    })
    
  }
}
