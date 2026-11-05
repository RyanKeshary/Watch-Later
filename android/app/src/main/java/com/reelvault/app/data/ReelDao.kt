package com.reelvault.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update

@Dao
interface ReelDao {
    @Query("SELECT * FROM reels_local WHERE url = :url LIMIT 1")
    suspend fun getReelByUrl(url: String): LocalReel?

    @Query("SELECT * FROM reels_local WHERE sync_status IN ('local_pending_sync', 'pending_auth') ORDER BY created_at ASC")
    suspend fun getPendingReels(): List<LocalReel>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReel(reel: LocalReel): Long

    @Update
    suspend fun updateReel(reel: LocalReel)

    @Query("UPDATE reels_local SET sync_status = :status, remote_id = :remoteId WHERE id = :id")
    suspend fun markSynced(id: Long, remoteId: String, status: String = "synced")

    @Query("UPDATE reels_local SET sync_status = 'local_pending_sync' WHERE sync_status = 'pending_auth'")
    suspend fun markPendingAuthAsPendingSync()
}

