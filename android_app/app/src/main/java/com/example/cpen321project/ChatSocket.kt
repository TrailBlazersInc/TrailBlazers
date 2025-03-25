package com.example.cpen321project
import io.socket.client.IO;
import io.socket.client.Socket;
import java.net.URISyntaxException

object ChatSocket {
    val socket: Socket? = try {
        IO.socket(BuildConfig.BACKEND_URL)
    } catch (e: URISyntaxException) {
        e.printStackTrace()
        null
    }

}