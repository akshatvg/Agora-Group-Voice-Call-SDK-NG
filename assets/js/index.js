var rtc = {
  // For the local client.
  client: null,
  // For the local audio track.
  localAudioTrack: null,
};

var options = {
  appId: "a6af85f840ef43108491705e2315a857",
  channel: null,
  token: null,
};

// the demo can auto join channel with params in url
$(() => {
  var urlParams = new URL(location.href).searchParams;
  options.appid = "a6af85f840ef43108491705e2315a857";
  options.channel = urlParams.get("channel");
  if (options.appid && options.channel) {
    $("#channel").val(options.channel);
    $("#join-form").submit();
  }
  enableUiControls();
})

$("#join-form").submit(async function (e) {
  e.preventDefault();
  $("#join").attr("disabled", true);
  try {
    options.appid = "a6af85f840ef43108491705e2315a857";
    options.channel = $("#channel").val();
    await join();
  } catch (error) {
    console.error(error);
  } finally {
    $("#leave").attr("disabled", false);
  }
})

$("#leave").click(function (e) {
  leaveCall();
})

async function leaveCall() {
  // Destroy the local audio and track.
  rtc.localAudioTrack.close();
  // Leave the channel.
  await rtc.client.leave();
  $("#mic-btn").prop("disabled", true);
  $("#join").attr("disabled", false);
  $("#leave").attr("disabled", true);
}

async function join() {
  rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  const uid = await rtc.client.join(options.appId, options.channel, options.token, null);
  $("#mic-btn").prop("disabled", false);
  // Create an audio track from the audio sampled by a microphone.
  rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  // Publish the local audio track to the channel.
  await rtc.client.publish([rtc.localAudioTrack]);
  $("#local-player-name").append(`<div id="player-wrapper-${uid}">
  <p class="player-name">localUser(${uid})</p>
</div>`);
  // publish local tracks to channel
  console.log("Successfully published.");
  rtc.client.on("user-published", async (user, mediaType) => {
    // Subscribe to a remote user.
    await rtc.client.subscribe(user, mediaType);
    console.log("Successfully subscribed.");
    // If the subscribed track is audio.
    if (mediaType === "audio") {
      const player = $(`
          <div id="player-wrapper-${uid}">
            <p class="player-name">remoteUser(${uid})</p>
          </div>
        `);
      $("#remote-playerlist").append(player);
      // Get `RemoteAudioTrack` in the `user` object.
      const remoteAudioTrack = user.audioTrack;
      // Play the audio track. No need to pass any DOM element.
      remoteAudioTrack.play();
    }
  });
  rtc.client.on("user-unpublished", user => {
    // Get the dynamically created DIV container.
    const playerContainer = document.getElementById("player-wrapper-" + uid);
    // Destroy the container.
    playerContainer.remove();
  });
}

// Action buttons
function enableUiControls() {
  $("#mic-btn").click(function () {
    toggleMic();
  });
}

// Toggle Mic
function toggleMic() {
  if ($("#mic-icon").hasClass('fa-microphone')) {
    rtc.localAudioTrack.setEnabled(false);
    console.log("Muted.");
  } else {
    rtc.localAudioTrack.setEnabled(true);
    console.log("Unmuted.");
  }
  $("#mic-icon").toggleClass('fa-microphone').toggleClass('fa-microphone-slash');
}