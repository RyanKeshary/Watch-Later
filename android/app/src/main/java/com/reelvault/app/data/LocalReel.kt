package com.reelvault.app.data

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "reels_local")
data class LocalReel(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "remote_id")
    val remoteId: String? = null,

    @ColumnInfo(name = "url")
    val url: String,

    @ColumnInfo(name = "raw_shared_text")
    val rawSharedText: String,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "sync_status")
    val syncStatus: String = "local_pending_sync", // local_pending_sync | synced | sync_failed | pending_auth

    @ColumnInfo(name = "retry_count")
    val retryCount: Int = 0
)

