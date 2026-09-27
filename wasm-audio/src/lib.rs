use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct AudioProcessor {
    rms: f32,
    peak: f32,
    buffer_size: usize,
    sample_rate: f32,
    
    frames_since_onset: usize,
    onset_index: isize,
    threshold: f32,

    // Pitch Detection
    pitch_buffer: Vec<f32>,
    pitch_buffer_idx: usize,
    yin_buffer: Vec<f32>,
    frames_since_pitch: usize,
    last_pitch: f32,
}

#[wasm_bindgen]
impl AudioProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(buffer_size: usize, sample_rate: f32) -> Self {
        // We use a 2048 sample buffer for pitch detection, 
        // covering ~42ms at 48kHz, suitable for 82Hz (Low E) detection.
        let pitch_buffer_size = 2048;
        
        Self {
            rms: 0.0,
            peak: 0.0,
            buffer_size,
            sample_rate,
            frames_since_onset: 48000, 
            onset_index: -1,
            threshold: 0.05, 

            pitch_buffer: vec![0.0; pitch_buffer_size],
            pitch_buffer_idx: 0,
            yin_buffer: vec![0.0; pitch_buffer_size],
            frames_since_pitch: 0,
            last_pitch: -1.0,
        }
    }

    pub fn process(&mut self, input: &[f32]) {
        let mut sum = 0.0;
        let mut peak = 0.0_f32;
        let length = input.len();
        let mut onset_idx = -1;

        for (i, &sample) in input.iter().enumerate() {
            let abs_sample = sample.abs();
            if abs_sample > peak {
                peak = abs_sample;
            }
            sum += sample * sample;

            // Simple Onset Detection
            if abs_sample > self.threshold && self.frames_since_onset > 4000 {
                onset_idx = i as isize;
                self.frames_since_onset = 0;
            } else {
                self.frames_since_onset += 1;
            }

            // Fill circular pitch buffer
            self.pitch_buffer[self.pitch_buffer_idx] = sample;
            self.pitch_buffer_idx = (self.pitch_buffer_idx + 1) % self.pitch_buffer.len();
        }

        self.rms = (sum / length as f32).sqrt();
        self.peak = peak;
        self.onset_index = onset_idx;

        // Pitch Detection logic
        self.frames_since_pitch += length;
        
        // Run YIN pitch detection every 1024 frames (~21ms)
        if self.frames_since_pitch >= 1024 {
            self.frames_since_pitch = 0;
            
            // Only attempt pitch detection if RMS is above a small threshold (e.g., 0.01)
            // and we are past the initial transient noise (e.g., > 1000 frames since onset).
            if self.rms > 0.01 && self.frames_since_onset > 1000 {
                self.last_pitch = self.compute_yin();
            } else {
                self.last_pitch = -1.0;
            }
        }
    }

    fn compute_yin(&mut self) -> f32 {
        let tau_min = (self.sample_rate / 1000.0) as usize; // Max 1000 Hz
        let tau_max = (self.sample_rate / 82.0) as usize;   // Min 82 Hz (Low E)
        let buf_len = self.pitch_buffer.len();
        
        // Reconstruct contiguous buffer from circular buffer
        let mut contiguous = vec![0.0; buf_len];
        for i in 0..buf_len {
            let idx = (self.pitch_buffer_idx + i) % buf_len;
            contiguous[i] = self.pitch_buffer[idx];
        }

        // 1. Difference function
        for tau in tau_min..=tau_max {
            let mut sum = 0.0;
            for i in 0..(buf_len - tau_max) {
                let delta = contiguous[i] - contiguous[i + tau];
                sum += delta * delta;
            }
            self.yin_buffer[tau] = sum;
        }

        // 2. Cumulative mean normalized difference function
        let mut running_sum = 0.0;
        self.yin_buffer[0] = 1.0;
        for tau in 1..=tau_max {
            if tau < tau_min {
                running_sum += self.yin_buffer[tau];
                self.yin_buffer[tau] = 1.0;
                continue;
            }
            running_sum += self.yin_buffer[tau];
            if running_sum == 0.0 {
                self.yin_buffer[tau] = 1.0;
            } else {
                self.yin_buffer[tau] = self.yin_buffer[tau] * (tau as f32) / running_sum;
            }
        }

        // 3. Absolute threshold
        let threshold = 0.20; // 20% tolerance for guitar
        let mut tau_estimate = 0;
        for tau in tau_min..=tau_max {
            if self.yin_buffer[tau] < threshold {
                let mut min_tau = tau;
                while min_tau + 1 <= tau_max && self.yin_buffer[min_tau + 1] < self.yin_buffer[min_tau] {
                    min_tau += 1;
                }
                tau_estimate = min_tau;
                break;
            }
        }

        // 4. Parabolic interpolation
        if tau_estimate > 0 && tau_estimate < tau_max {
            let s0 = self.yin_buffer[tau_estimate - 1];
            let s1 = self.yin_buffer[tau_estimate];
            let s2 = self.yin_buffer[tau_estimate + 1];
            let shift = 0.5 * (s2 - s0) / (s0 - 2.0 * s1 + s2);
            let better_tau = tau_estimate as f32 + shift;
            return self.sample_rate / better_tau;
        }

        -1.0
    }

    pub fn get_rms(&self) -> f32 {
        self.rms
    }

    pub fn get_peak(&self) -> f32 {
        self.peak
    }
    
    pub fn get_onset_index(&self) -> isize {
        self.onset_index
    }

    pub fn get_pitch(&self) -> f32 {
        self.last_pitch
    }
}
