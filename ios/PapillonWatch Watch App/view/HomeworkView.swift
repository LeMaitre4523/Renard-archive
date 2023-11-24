//
//  HomeworkView.swift
//  PapillonWatch Watch App
//
//  Created by Tom Theret on 23/10/2023.
//

import SwiftUI

struct HomeworkView: View {
    @ObservedObject var phoneConnector: PhoneConnector
    @State private var selectedHomeworkIndex: Int?
    
    init(phoneConnector: PhoneConnector) {
        self.phoneConnector = phoneConnector
    }

    var body: some View {
        if phoneConnector.receivedHomeworkJson.isEmpty {
            Text("Pas de devoir !")
                .navigationTitle("Devoirs")
        } else {
            List {
                ForEach(phoneConnector.receivedHomeworkJson, id: \.id) { homeworkList in
                    Section(header: Text("pour \(homeworkList.formattedDate)")) {
                        ForEach(homeworkList.homeworks.indices, id: \.self) { index in
                            HomeworkRow(
                                homework: homeworkList.homeworks[index],
                                isDone: self.bindingForHomework(index)
                            )
                        }
                    }
                }
            }
            .navigationTitle("Devoirs")
        }
    }
    
    private func bindingForHomework(_ index: Int) -> Binding<Bool> {
        return Binding(
            get: { selectedHomeworkIndex == index },
            set: { newValue in
                if newValue {
                    selectedHomeworkIndex = index
                } else {
                    selectedHomeworkIndex = nil
                }
            }
        )
    }
}

struct CheckboxToggleStyle: ToggleStyle {
  @Environment(\.isEnabled) var isEnabled
  let style: Style // custom param

  func makeBody(configuration: Configuration) -> some View {
    Button(action: {
      configuration.isOn.toggle() // toggle the state binding
    }, label: {
      HStack {
        Image(systemName: configuration.isOn ? "checkmark.\(style.sfSymbolName).fill" : style.sfSymbolName)
          .imageScale(.large)
        configuration.label
      }
    })
    .buttonStyle(PlainButtonStyle()) // remove any implicit styling from the button
    .disabled(!isEnabled)
  }

  enum Style {
    case square, circle

    var sfSymbolName: String {
      switch self {
      case .square:
        return "square"
      case .circle:
        return "circle"
      }
    }
  }
}

#Preview {
    HomeworkView(phoneConnector: PhoneConnector())
}
