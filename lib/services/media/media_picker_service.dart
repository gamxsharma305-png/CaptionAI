import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../shared/models/media_file.dart';

/// Picks video/audio files from the device, handling runtime permissions.
///
/// Uses the gallery picker for video (better UX on mobile) and the file
/// picker as a fallback / for audio files.
class MediaPickerService {
  final ImagePicker _imagePicker = ImagePicker();

  Future<bool> _ensurePermission(Permission permission) async {
    var status = await permission.status;
    if (status.isGranted) return true;
    status = await permission.request();
    if (status.isPermanentlyDenied) {
      // Let the user grant it manually in system settings.
      await openAppSettings();
    }
    return status.isGranted;
  }

  /// Picks a video. When [fromGallery] is true the system gallery is used,
  /// otherwise a generic file picker is shown.
  Future<MediaFile?> pickVideo({bool fromGallery = true}) async {
    if (fromGallery) {
      final granted = await _ensurePermission(Permission.videos);
      if (!granted) return null;
      final picked = await _imagePicker.pickVideo(source: ImageSource.gallery);
      if (picked == null) return null;
      return MediaFile(
        path: picked.path,
        type: MediaType.video,
        name: picked.name,
      );
    }

    final result = await FilePicker.platform.pickFiles(
      type: FileType.video,
      allowMultiple: false,
    );
    final file = result?.files.single;
    final path = file?.path;
    if (path == null || file == null) return null;
    return MediaFile(path: path, type: MediaType.video, name: file.name);
  }

  /// Picks an audio file via the system file picker.
  Future<MediaFile?> pickAudio() async {
    final granted = await _ensurePermission(Permission.audio);
    if (!granted) return null;
    final result = await FilePicker.platform.pickFiles(
      type: FileType.audio,
      allowMultiple: false,
    );
    final file = result?.files.single;
    final path = file?.path;
    if (path == null || file == null) return null;
    return MediaFile(path: path, type: MediaType.audio, name: file.name);
  }
}
