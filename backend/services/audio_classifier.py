import os
import numpy as np
import librosa
import scipy.stats
import scipy.signal

class AudioClassifier:
    def __init__(self):
        # Training Data (Centroids) - From MATLAB Code
        # Cas 1, Cas 2, Cas 3
        self.trainData = np.array([
            [290.78, 142.79, 528.89, 0.0390, 0.0704, 0.38664, 0.07893, 4417, -1.52, 8.25, 0.0916, -1.77],
            [259.43, 132.78, 529.62, 0.0362, 0.0481, 0.45947, 0.12835, 3887, -10.71, 7.42, 0.0718, -1.03],
            [269.36, 129.21, 523.30, 0.0636, 0.0710, 0.42400, 0.09700, 3330, 2.28, 7.80, 0.0550, 0.08]
        ])
        
        # Normalization Stats (Median & MAD)
        self.mu = np.nanmedian(self.trainData, axis=0)
        self.sig = scipy.stats.median_abs_deviation(self.trainData, axis=0, scale='normal')
        
        # Handle zero division if MAD is 0 (Fallback to STD as per MATLAB)
        mask = (self.sig == 0)
        if np.any(mask):
            self.sig[mask] = np.std(self.trainData[:, mask], axis=0)

        # Normalize Centroids
        self.C = (self.trainData - self.mu) / (self.sig + np.finfo(float).eps)

    def extract_features(self, y, fs):
        """
        Extract Features corresponding to MATLAB 'forana_features'.
        Features: [F0_mean, F0_std, F0_range, RMS_mean, RMS_std, 
                   Jitter_mean, Shimmer_mean, SpecCent_mean, HNR_mean, 
                   Entropy, ZCR_mean, MFCC1_mean]
        """
        # Parameters
        frame_length = int(round(0.03 * fs))
        overlap = int(round(0.015 * fs))
        hop_length = frame_length - overlap # Librosa uses hop_length

        # 1. F0 (Pitch) - using PYIN (Robust pitch tracking)
        f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=70, fmax=600, sr=fs, 
                                                     frame_length=int(round(0.04*fs)), 
                                                     hop_length=int(round(0.02*fs)))
        f0 = f0[~np.isnan(f0)] # Remove NaNs
        
        if len(f0) > 0:
            F0_mean = np.mean(f0)
            F0_std = np.std(f0)
            F0_range = np.max(f0) - np.min(f0)
        else:
            F0_mean, F0_std, F0_range = 0, 0, 0

        # 2. RMS (Energy)
        rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)
        RMS_mean = np.mean(rms)
        RMS_std = np.std(rms)

        # 3. Jitter
        if len(f0) > 2:
            jitter_mean = np.std(np.diff(f0)) / np.mean(f0)
        else:
            jitter_mean = 0

        # 4. Shimmer
        # Amplitude Envelope via Hilbert
        analytic_signal = scipy.signal.hilbert(y)
        amplitude_envelope = np.abs(analytic_signal)
        if len(amplitude_envelope) > 1:
            shimmer_mean = np.std(np.diff(amplitude_envelope)) / np.mean(amplitude_envelope)
        else:
            shimmer_mean = 0

        # 5. Spectral Centroid
        cent = librosa.feature.spectral_centroid(y=y, sr=fs, n_fft=frame_length, hop_length=hop_length)
        SpecCent_mean = np.mean(cent)

        # 6. HNR (Harmonic-to-Noise Ratio) - Approximation via Autocorrelation
        # MATLAB: xcorr(y, 'coeff'), find peaks
        # Python: librosa.autocorrelate or manual correlate
        # Efficient way:
        acf = librosa.autocorrelate(y)
        # Find peaks - Skip 0-lag peak
        peaks = scipy.signal.find_peaks(acf)[0]
        if len(peaks) > 1:
            # First peak after 0 lag
            pks_idx = peaks[0]
            if pks_idx == 0 and len(peaks) > 1: pks_idx = peaks[1] 
            
            # Use max peak after lag 0 to be safe (pitch period)
            # Actually MATLAB code takes pks(2). pks(1) is lag 0 (1.0 correlation).
            # librosa.autocorrelate returns unnormalized. 
            
            # Let's normalized ACF manually to match MATLAB 'coeff'
            norm_acf = acf / acf[0]
            peaks, _ = scipy.signal.find_peaks(norm_acf)
            
            # Check peaks
            if len(peaks) > 0:
                # Find best peak in valid pitch range?
                # MATLAB just takes pks(2) which implies the first peak after 0.
                peak_val = norm_acf[peaks[0]]
                HNR_mean = 10 * np.log10(peak_val / (1 - peak_val + np.finfo(float).eps))
            else:
                HNR_mean = 0
        else:
            HNR_mean = 0

        # 7. Energy Entropy
        # Split into frames
        frames = librosa.util.frame(y**2, frame_length=frame_length, hop_length=hop_length)
        frame_energies = np.sum(frames, axis=0)
        total_energy = np.sum(frame_energies)
        if total_energy > 0:
            p = frame_energies / total_energy
            # Entropy: -sum(p * log2(p))
            # Avoid log(0)
            p = p[p > 0]
            EnergyEntropy = -np.sum(p * np.log2(p + np.finfo(float).eps))
        else:
            EnergyEntropy = 0

        # 8. Zero Crossing Rate
        zcr = librosa.feature.zero_crossing_rate(y, frame_length=frame_length, hop_length=hop_length)
        ZCR_mean = np.mean(zcr)

        # 9. MFCCs (13 coeffs)
        mfcc = librosa.feature.mfcc(y=y, sr=fs, n_mfcc=13, n_fft=frame_length, hop_length=hop_length, window='hamming')
        MFCC_means = np.mean(mfcc, axis=1)
        # MATLAB: MFCC_means(1). Usually index 1 in MATLAB is index 0 in Python (1st coeff).
        # OR index 1 in MATLAB (2nd coeff).
        # MATLAB's `mfcc` usually returns 13 coeffs. If standard, index 1 is the 1st coefficent (often related to energy, sometimes dropped).
        # Assuming direct translation: MATLAB(1) -> Python[0]
        MFCC1_mean = MFCC_means[0]

        return np.array([F0_mean, F0_std, F0_range, RMS_mean, RMS_std, 
                         jitter_mean, shimmer_mean, SpecCent_mean, HNR_mean,
                         EnergyEntropy, ZCR_mean, MFCC1_mean])

    def classify(self, file_path):
        """
        Classifies the audio file.
        Returns: (predicted_class, confidence_score)
        """
        try:
            # 1. Load Audio
            y, fs = librosa.load(file_path, sr=None) # Keep native SR
            
            # 2. Preprocessing
            if len(y.shape) > 1:
                y = np.mean(y, axis=1) # Mono
            
            # Normalize
            max_val = np.max(np.abs(y))
            if max_val > 0:
                y = y / max_val

            # 3. Speech Detection (VAD)
            # MATLAB: detects segments. If empty return Class 1.
            # Python: librosa.effects.split
            intervals = librosa.effects.split(y, top_db=25) # Approx -25dB threshold
            if len(intervals) == 0:
                return 'classe_1', 1.0 # Non-verbal

            # 4. Feature Extraction
            features = self.extract_features(y, fs)
            
            # 5. Normalization using stats from trainData
            featuresZ = (features - self.mu) / (self.sig + np.finfo(float).eps)
            
            # 6. Distance Calculation (Euclidean)
            # dataZ is shape (12,), self.C is (3, 12)
            dists = np.sum((self.C - featuresZ)**2, axis=1) # shape (3,)
            
            # 7. Classification
            class_idx = np.argmin(dists) # 0, 1, 2
            
            classes = ['classe_1', 'classe_2', 'classe_3']
            predicted_class = classes[class_idx]
            
            # Confidence (Inverse of distance, normalized?)
            # Simple heuristic: 1 / (1 + dist)
            # Or Softmax of negative distances
            # Let's map small dist to high confidence.
            confidence = 1.0 / (1.0 + dists[class_idx])
            
            # Map score to 0-1 nicely
            confidence = float(np.clip(confidence, 0, 1))

            print(f"[DEBUG] File: {os.path.basename(file_path)}")
            print(f"[DEBUG] Features: {features}")
            print(f"[DEBUG] Distances: {dists} -> Class {class_idx+1}")

            return predicted_class, confidence

        except Exception as e:
            print(f"[ERROR] Classification failed: {e}")
            return 'classe_1', 0.0 # Default fallback
