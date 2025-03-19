package com.example.cpen321project
import android.content.Context
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.InputStream
import java.security.KeyStore
import java.security.cert.CertificateFactory
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import android.util.Log
import com.google.android.apps.common.testing.accessibility.framework.BuildConfig

object RetrofitClient {
    private var retrofit: Retrofit? = null

    fun getClient(context: Context): Retrofit{
        if (retrofit == null){
            try{
                val certificateFactory = CertificateFactory.getInstance("X.509")
                val certInputStream: InputStream = context.resources.openRawResource(R.raw.fullchain)

                val keyStore = KeyStore.getInstance(KeyStore.getDefaultType()).apply {
                    load(null, null)
                    setCertificateEntry("ca", certificateFactory.generateCertificate(certInputStream))
                }
                certInputStream.close()

                val trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()).apply {
                    init(keyStore)
                }

                val sslContext = SSLContext.getInstance("TLS").apply {
                    init(null, trustManagerFactory.trustManagers, null)
                }

                val client = OkHttpClient.Builder()
                    .sslSocketFactory(sslContext.socketFactory, trustManagerFactory.trustManagers[0] as javax.net.ssl.X509TrustManager)
                    .build()

                retrofit = Retrofit.Builder()
                    .baseUrl(com.example.cpen321project.BuildConfig.BACKEND_URL)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()
            } catch (e: IOException) {  // Handle network failures
                Log.e("Retrofit", "Network error: ${e.message}", e)
            } catch (e: HttpException) {
                Log.e("Retrofit", "HTTP error: ${e.code()} - ${e.message}", e)
            } catch (e: JsonParseException) {  // Handle JSON parsing issues
                Log.e("Retrofit", "JSON parsing error: ${e.message}", e)
            } catch (e: Exception) {  // Catch any unexpected errors
                Log.e("Retrofit", "Unexpected error: ${e.message}", e)
            }
        }

        return retrofit!!
    }

}