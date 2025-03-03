package com.example.cpen321andriodapp

import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Call
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface ApiService {
    @POST("/api/v1/auth/google")
    fun postUser(
        @Body request: RequestBody
    ): Call<ResponseBody>

    @PUT("/User/{email}")
    fun updateUser(
        @Header("Authorization") token: String,
        @Path("email") email: String,
        @Body request: RequestBody
    ): Call<ResponseBody>


    @POST("/recommendations/{email}")
    fun getRecommendations(
        @Header("Authorization") token: String,
        @Path("email") email: String,
        @Body request: RequestBody
    ): Call<ResponseBody>

    @GET("/chat/{email}")
    fun getChats(
        @Header("Authorization") token : String,
        @Path("email") email: String
    ): Call<ResponseBody>
}